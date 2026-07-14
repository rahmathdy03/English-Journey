/**
 * Returns quiz questions based on week, day, and quiz type.
 *
 * @param {number} week
 * @param {number} day
 * @param {string} type
 * @returns {Array<Object>}
 */
function questionsFor_(week, day, type) {
  return QUESTION_BANK.filter(function (question) {
    return (
      Number(question.week) === Number(week) &&
      Number(question.day) === Number(day) &&
      String(question.quizType) === String(type)
    );
  });
}

/**
 * Converts a private quiz question into a safe frontend object.
 * The correct answer and explanation are not sent to the frontend.
 *
 * @param {Object} question
 * @returns {Object}
 */
function publicQuestion_(question) {
  return {
    id: question.id,
    kindLabel: question.kindLabel,
    prompt: question.prompt,
    context: question.context || "",
    options: shuffle_(question.options.slice())
  };
}

/**
 * Randomizes the order of an array.
 *
 * @param {Array<*>} array
 * @returns {Array<*>}
 */
function shuffle_(array) {
  for (let index = array.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporaryValue = array[index];

    array[index] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

/**
 * Loads quiz questions for a user.
 *
 * @param {Object} user
 * @param {Object} payload
 * @returns {Object}
 */
function getQuiz_(user, payload) {
  const week = requireInteger_(payload.week, "week", 1, 999);
  const day = requireInteger_(payload.day, "day", 1, 6);
  const quizType = requireString_(payload.quizType, "quizType", 20);

  const allowedQuizTypes = [
    "vocabulary",
    "grammar",
    "mixed"
  ];

  if (allowedQuizTypes.indexOf(quizType) < 0) {
    throw appError_(
      "Invalid quiz type.",
      "VALIDATION_ERROR"
    );
  }

  const dailyProgress = dailyRow_(
    user.user_id,
    week,
    day,
    false
  );

  const status = progressStatus_(dailyProgress);

  if (
    !status.vocabularyCompleted ||
    !status.grammarCompleted
  ) {
    throw appError_(
      "Complete vocabulary and grammar first.",
      "PRACTICE_LOCKED"
    );
  }

  const questions = questionsFor_(
    week,
    day,
    quizType
  );

  if (!questions.length) {
    throw appError_(
      "Quiz content is unavailable.",
      "CONTENT_NOT_AVAILABLE"
    );
  }

  return {
    week: week,
    day: day,
    quizType: quizType,
    questions: questions.map(publicQuestion_)
  };
}

/**
 * Submits and processes a quiz.
 *
 * @param {Object} user
 * @param {Object} payload
 * @returns {Object}
 */
function submitQuiz_(user, payload) {
  const week = requireInteger_(
    payload.week,
    "week",
    1,
    999
  );

  const day = requireInteger_(
    payload.day,
    "day",
    1,
    6
  );

  const quizType = requireString_(
    payload.quizType,
    "quizType",
    20
  );

  const allowedQuizTypes = [
    "vocabulary",
    "grammar",
    "mixed"
  ];

  if (allowedQuizTypes.indexOf(quizType) < 0) {
    throw appError_(
      "Invalid quiz type.",
      "VALIDATION_ERROR"
    );
  }

  const answers = payload.answers;

  if (!Array.isArray(answers)) {
    throw appError_(
      "answers must be an array.",
      "VALIDATION_ERROR"
    );
  }

  const questions = questionsFor_(
    week,
    day,
    quizType
  );

  if (!questions.length) {
    throw appError_(
      "Quiz content is unavailable.",
      "CONTENT_NOT_AVAILABLE"
    );
  }

  const answersByQuestionId = {};

  answers.forEach(function (answerItem) {
    const questionId = String(
      answerItem.questionId
    );

    const answerValue = String(
      answerItem.answer == null
        ? ""
        : answerItem.answer
    );

    answersByQuestionId[questionId] =
      answerValue;
  });

  const mistakes = [];
  let correctCount = 0;

  questions.forEach(function (question) {
    const userAnswer =
      answersByQuestionId[question.id] || "";

    const isCorrect = safeEqual_(
      userAnswer,
      question.answer
    );

    if (isCorrect) {
      correctCount++;
    } else {
      mistakes.push({
        questionId: question.id,
        prompt: question.prompt,
        userAnswer: userAnswer,
        correctAnswer: question.answer,
        explanation: question.explanation
      });
    }

    updateLearningItem_(
      user.user_id,
      question,
      isCorrect
    );
  });

  const totalQuestions = questions.length;

  const score = Math.round(
    (correctCount / totalQuestions) * 100
  );

  const wrongCount =
    totalQuestions - correctCount;

  return withWriteLock_(function () {
    appendObject_("LearningHistory", {
      history_id: uuid_(),
      user_id: user.user_id,
      date: dateKey_(),
      week: week,
      day: day,
      quiz_type: quizType,
      score: score,
      correct_count: correctCount,
      wrong_count: wrongCount,
      mistakes_json: JSON.stringify(mistakes),
      created_at: nowIso_()
    });

    const dailyProgress = dailyRow_(
      user.user_id,
      week,
      day,
      true
    );

    const progressPatch = {
  date: dateKey_(),
  updated_at: nowIso_()
};

    progressPatch[
      quizType + "_quiz_completed"
    ] = true;

    const projectedProgress =
      Object.assign(
        {},
        dailyProgress,
        progressPatch
      );

    const allQuizzesCompleted =
      bool_(
        projectedProgress
          .vocabulary_quiz_completed
      ) &&
      bool_(
        projectedProgress
          .grammar_quiz_completed
      ) &&
      bool_(
        projectedProgress
          .mixed_quiz_completed
      );

    if (allQuizzesCompleted) {
      progressPatch.practice_completed = true;

      if (!bool_(dailyProgress.daily_completed)) {
        progressPatch.daily_completed = true;
        progressPatch.date = dateKey_();
      }
    }

    updateObjectRow_(
      "DailyProgress",
      dailyProgress._row,
      progressPatch
    );

    if (
      allQuizzesCompleted &&
      !bool_(dailyProgress.daily_completed)
    ) {
      updateStreakAndAdvance_(
        user,
        week,
        day
      );
    } else {
      recalculateUserStats_(
        user.user_id
      );
    }

    /*
     * Dinonaktifkan sementara agar proses submit
     * quiz lebih cepat dan mengurangi timeout.
     *
     * Achievement tetap dapat dihitung saat
     * halaman Achievements dibuka.
     */
    // evaluateAchievements_(user.user_id);

    return {
      score: score,
      correctCount: correctCount,
      wrongCount: wrongCount,
      mistakes: mistakes,
      progressSaved: true,
      dailyCompleted: allQuizzesCompleted
    };
  });
}

/**
 * Updates vocabulary or grammar progress based on a quiz answer.
 *
 * @param {string} userId
 * @param {Object} question
 * @param {boolean} correct
 */
function updateLearningItem_(
  userId,
  question,
  correct
) {
  if (question.itemType === "vocabulary") {
    updateVocabularyProgress_(
      userId,
      question,
      correct
    );

    return;
  }

  if (question.itemType === "grammar") {
    updateGrammarProgress_(
      userId,
      question,
      correct
    );
  }
}

/**
 * Updates vocabulary progress.
 *
 * @param {string} userId
 * @param {Object} question
 * @param {boolean} correct
 */
function updateVocabularyProgress_(
  userId,
  question,
  correct
) {
  let progressRow = findOne_(
    "VocabularyProgress",
    function (row) {
      return (
        String(row.user_id) === String(userId) &&
        String(row.word_id) ===
          String(question.itemId)
      );
    }
  );

  if (!progressRow) {
    const vocabularyItem =
      allVocabulary_().find(function (word) {
        return (
          String(word.id) ===
          String(question.itemId)
        );
      });

    if (vocabularyItem) {
      appendObject_("VocabularyProgress", {
        id: uuid_(),
        user_id: userId,
        word_id: vocabularyItem.id,
        word: vocabularyItem.word,
        week: question.week,
        day: question.day,
        status: "learning",
        correct_count: 0,
        wrong_count: 0,
        is_favorite: false,
        last_reviewed: "",
        updated_at: nowIso_()
      });

      progressRow = findOne_(
        "VocabularyProgress",
        function (row) {
          return (
            String(row.user_id) ===
              String(userId) &&
            String(row.word_id) ===
              String(question.itemId)
          );
        }
      );
    }
  }

  if (!progressRow) {
    return;
  }

  const correctCount =
    Number(progressRow.correct_count || 0) +
    (correct ? 1 : 0);

  const wrongCount =
    Number(progressRow.wrong_count || 0) +
    (correct ? 0 : 1);

  let status = "learning";

  if (correctCount >= 3) {
    status = "mastered";
  } else if (wrongCount >= 2) {
    status = "difficult";
  }

  updateObjectRow_(
    "VocabularyProgress",
    progressRow._row,
    {
      correct_count: correctCount,
      wrong_count: wrongCount,
      status: status,
      last_reviewed: nowIso_(),
      updated_at: nowIso_()
    }
  );
}

/**
 * Updates grammar progress.
 *
 * @param {string} userId
 * @param {Object} question
 * @param {boolean} correct
 */
function updateGrammarProgress_(
  userId,
  question,
  correct
) {
  let progressRow = findOne_(
    "GrammarProgress",
    function (row) {
      return (
        String(row.user_id) === String(userId) &&
        String(row.grammar_id) ===
          String(question.itemId)
      );
    }
  );

  if (!progressRow) {
    appendObject_("GrammarProgress", {
      id: uuid_(),
      user_id: userId,
      grammar_id: question.itemId,
      grammar_title: question.itemTitle,
      week: question.week,
      day: question.day,
      status: "learning",
      correct_count: 0,
      wrong_count: 0,
      accuracy: 0,
      updated_at: nowIso_()
    });

    progressRow = findOne_(
      "GrammarProgress",
      function (row) {
        return (
          String(row.user_id) ===
            String(userId) &&
          String(row.grammar_id) ===
            String(question.itemId)
        );
      }
    );
  }

  if (!progressRow) {
    return;
  }

  const correctCount =
    Number(progressRow.correct_count || 0) +
    (correct ? 1 : 0);

  const wrongCount =
    Number(progressRow.wrong_count || 0) +
    (correct ? 0 : 1);

  const totalAnswers =
    correctCount + wrongCount;

  const accuracy =
    totalAnswers > 0
      ? (correctCount / totalAnswers) * 100
      : 0;

  let status = "learning";

  if (
    accuracy >= 80 &&
    correctCount >= 3
  ) {
    status = "completed";
  } else if (wrongCount >= 2) {
    status = "needs review";
  }

  updateObjectRow_(
    "GrammarProgress",
    progressRow._row,
    {
      correct_count: correctCount,
      wrong_count: wrongCount,
      accuracy: accuracy,
      status: status,
      updated_at: nowIso_()
    }
  );
}

/**
 * Returns all vocabulary items from lesson data.
 *
 * @returns {Array<Object>}
 */
function allVocabulary_() {
  let vocabularyItems = [];

  Object.keys(LESSON_DATA).forEach(
    function (weekKey) {
      const weekData = LESSON_DATA[weekKey];

      weekData.days.forEach(function (dayData) {
        vocabularyItems =
          vocabularyItems.concat(
            dayData.vocabulary
          );
      });
    }
  );

  return vocabularyItems;
}

/**
 * Returns quiz results for a specific day.
 *
 * @param {Object} user
 * @param {Object} payload
 * @returns {Object}
 */
function getResult_(user, payload) {
  const week = requireInteger_(
    payload.week,
    "week",
    1,
    999
  );

  const day = requireInteger_(
    payload.day,
    "day",
    1,
    6
  );

  const historyRows =
    valuesAsObjects_("LearningHistory")
      .filter(function (row) {
        return (
          String(row.user_id) ===
            String(user.user_id) &&
          Number(row.week) === week &&
          Number(row.day) === day
        );
      });

  const latestResultByType = {};

  historyRows.forEach(function (row) {
    latestResultByType[row.quiz_type] = row;
  });

  const quizTypes = [
    "vocabulary",
    "grammar",
    "mixed"
  ];

  const quizzes = quizTypes
    .filter(function (quizType) {
      return Boolean(
        latestResultByType[quizType]
      );
    })
    .map(function (quizType) {
      const result =
        latestResultByType[quizType];

      return {
        quizType: quizType,
        score: Number(result.score),
        correctCount: Number(
          result.correct_count
        ),
        wrongCount: Number(
          result.wrong_count
        )
      };
    });

  const mistakes = [];

  quizTypes.forEach(function (quizType) {
    const result =
      latestResultByType[quizType];

    if (!result) {
      return;
    }

    try {
      const parsedMistakes = JSON.parse(
        result.mistakes_json || "[]"
      );

      mistakes.push.apply(
        mistakes,
        parsedMistakes
      );
    } catch (error) {
      console.error(
        "Failed to parse quiz mistakes:",
        error
      );
    }
  });

  const finalScore = quizzes.length
    ? quizzes.reduce(
        function (total, quiz) {
          return total + quiz.score;
        },
        0
      ) / quizzes.length
    : 0;

  return {
    quizzes: quizzes,
    finalScore: finalScore,
    mistakes: mistakes
  };
}