/**
 * Converts common boolean representations into a real boolean.
 *
 * @param {*} value
 * @returns {boolean}
 */
function bool_(value) {
  return (
    value === true ||
    String(value).toLowerCase() === "true"
  );
}

/**
 * Normalizes a date value into YYYY-MM-DD.
 *
 * @param {*} value
 * @returns {string}
 */
function progressDateKey_(value) {
  if (!value) {
    return "";
  }

  if (
    Object.prototype.toString.call(value) ===
    "[object Date]"
  ) {
    if (isNaN(value.getTime())) {
      return "";
    }

    return dateKey_(value);
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parsedDate = new Date(text);

  if (!isNaN(parsedDate.getTime())) {
    return dateKey_(parsedDate);
  }

  return "";
}

/**
 * Returns one DailyProgress row.
 *
 * When create is true:
 * - a new row is created if none exists;
 * - an existing row with an empty date receives today's date.
 *
 * @param {string} userId
 * @param {number} week
 * @param {number} day
 * @param {boolean} create
 * @returns {Object|null}
 */
function dailyRow_(
  userId,
  week,
  day,
  create
) {
  const normalizedWeek = Number(week);
  const normalizedDay = Number(day);

  let progressRow = findOne_(
    "DailyProgress",
    function (row) {
      return (
        String(row.user_id) ===
          String(userId) &&
        Number(row.week) ===
          normalizedWeek &&
        Number(row.day) ===
          normalizedDay
      );
    }
  );

  if (!progressRow && create) {
    progressRow = appendObject_(
      "DailyProgress",
      {
        id: uuid_(),
        user_id: userId,
        date: dateKey_(),
        week: normalizedWeek,
        day: normalizedDay,

        vocabulary_completed: false,
        grammar_completed: false,
        practice_completed: false,
        daily_completed: false,

        vocabulary_quiz_completed: false,
        grammar_quiz_completed: false,
        mixed_quiz_completed: false,

        updated_at: nowIso_()
      }
    );

    progressRow._row =
      sheet_("DailyProgress").getLastRow();

    return progressRow;
  }

  /*
   * Old progress rows might have an empty date.
   * Set the date when that row is used again.
   */
  if (
    progressRow &&
    create &&
    !progressDateKey_(progressRow.date)
  ) {
    const today = dateKey_();

    updateObjectRow_(
      "DailyProgress",
      progressRow._row,
      {
        date: today,
        updated_at: nowIso_()
      }
    );

    progressRow.date = today;
  }

  return progressRow || null;
}

/**
 * Updates a DailyProgress row safely.
 *
 * This helper always writes today's date so the
 * learning calendar can show partial activity.
 *
 * @param {string} userId
 * @param {number} week
 * @param {number} day
 * @param {Object} changes
 * @returns {Object}
 */
function updateDailyProgress_(
  userId,
  week,
  day,
  changes
) {
  const progressRow = dailyRow_(
    userId,
    week,
    day,
    true
  );

  const patch = Object.assign(
    {},
    changes || {},
    {
      date: dateKey_(),
      updated_at: nowIso_()
    }
  );

  updateObjectRow_(
    "DailyProgress",
    progressRow._row,
    patch
  );

  return Object.assign(
    {},
    progressRow,
    patch
  );
}

/**
 * Determines whether a lesson can be opened.
 *
 * @param {Object} user
 * @param {number} week
 * @param {number} day
 * @returns {boolean}
 */
function lessonAccessible_(
  user,
  week,
  day
) {
  const requestedWeek = Number(week);
  const requestedDay = Number(day);

  const currentWeek = Number(
    user.current_week || 1
  );

  const currentDay = Number(
    user.current_day || 1
  );

  if (requestedWeek < currentWeek) {
    return true;
  }

  if (requestedWeek > currentWeek) {
    return false;
  }

  if (requestedDay <= currentDay) {
    return true;
  }

  if (requestedDay <= 1) {
    return false;
  }

  const previousProgress = dailyRow_(
    user.user_id,
    requestedWeek,
    requestedDay - 1,
    false
  );

  return Boolean(
    previousProgress &&
    bool_(previousProgress.daily_completed)
  );
}

/**
 * Updates the user's streak and unlocks the next day.
 *
 * @param {Object} user
 * @param {number} week
 * @param {number} day
 */
function updateStreakAndAdvance_(
  user,
  week,
  day
) {
  const today = dateKey_();

  const lastStudyDate =
    progressDateKey_(
      user.last_study_date
    );

  const yesterdayDate = new Date();
  yesterdayDate.setDate(
    yesterdayDate.getDate() - 1
  );

  const yesterday =
    dateKey_(yesterdayDate);

  let currentStreak = Number(
    user.current_streak || 0
  );

  if (lastStudyDate === today) {
    /*
     * The streak has already been counted today.
     */
  } else if (
    lastStudyDate === yesterday
  ) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }

  const completedDay = Number(day);

  const nextDay =
    completedDay < 6
      ? completedDay + 1
      : 7;

  updateObjectRow_(
    "Users",
    user._row,
    {
      current_day: nextDay,

      current_streak:
        currentStreak,

      best_streak: Math.max(
        currentStreak,
        Number(user.best_streak || 0)
      ),

      last_study_date: today,
      updated_at: nowIso_()
    }
  );

  recalculateUserStats_(
    user.user_id
  );
}

/**
 * Recalculates a user's stored statistics.
 *
 * @param {string} userId
 */
function recalculateUserStats_(
  userId
) {
  const user = findOne_(
    "Users",
    function (row) {
      return (
        String(row.user_id) ===
        String(userId)
      );
    }
  );

  if (!user) {
    return;
  }

  const vocabularyProgress =
    valuesAsObjects_(
      "VocabularyProgress"
    ).filter(function (row) {
      return (
        String(row.user_id) ===
        String(userId)
      );
    });

  const grammarProgress =
    valuesAsObjects_(
      "GrammarProgress"
    ).filter(function (row) {
      return (
        String(row.user_id) ===
        String(userId)
      );
    });

  const learningHistory =
    valuesAsObjects_(
      "LearningHistory"
    ).filter(function (row) {
      return (
        String(row.user_id) ===
        String(userId)
      );
    });

  const scoreRows =
    learningHistory.filter(
      function (row) {
        return (
          row.score !== "" &&
          row.score !== null &&
          !isNaN(Number(row.score))
        );
      }
    );

  const averageScore =
    scoreRows.length
      ? scoreRows.reduce(
          function (total, row) {
            return (
              total +
              Number(row.score || 0)
            );
          },
          0
        ) / scoreRows.length
      : 0;

  const totalGrammarAnswers =
    grammarProgress.reduce(
      function (total, row) {
        return (
          total +
          Number(
            row.correct_count || 0
          ) +
          Number(
            row.wrong_count || 0
          )
        );
      },
      0
    );

  const totalGrammarCorrect =
    grammarProgress.reduce(
      function (total, row) {
        return (
          total +
          Number(
            row.correct_count || 0
          )
        );
      },
      0
    );

  const grammarAccuracy =
    totalGrammarAnswers > 0
      ? (
          totalGrammarCorrect /
          totalGrammarAnswers
        ) * 100
      : 0;

  const masteredWords =
    vocabularyProgress.filter(
      function (row) {
        return (
          String(row.status) ===
          "mastered"
        );
      }
    ).length;

  updateObjectRow_(
    "Users",
    user._row,
    {
      total_words:
        vocabularyProgress.length,

      mastered_words:
        masteredWords,

      grammar_accuracy:
        grammarAccuracy,

      average_score:
        averageScore,

      updated_at:
        nowIso_()
    }
  );
}

/**
 * Returns a consistent frontend status object.
 *
 * @param {Object|null} progressRow
 * @returns {Object}
 */
function progressStatus_(
  progressRow
) {
  return {
    vocabularyCompleted:
      progressRow
        ? bool_(
            progressRow
              .vocabulary_completed
          )
        : false,

    grammarCompleted:
      progressRow
        ? bool_(
            progressRow
              .grammar_completed
          )
        : false,

    practiceCompleted:
      progressRow
        ? bool_(
            progressRow
              .practice_completed
          )
        : false,

    dailyCompleted:
      progressRow
        ? bool_(
            progressRow
              .daily_completed
          )
        : false,

    vocabularyQuizCompleted:
      progressRow
        ? bool_(
            progressRow
              .vocabulary_quiz_completed
          )
        : false,

    grammarQuizCompleted:
      progressRow
        ? bool_(
            progressRow
              .grammar_quiz_completed
          )
        : false,

    mixedQuizCompleted:
      progressRow
        ? bool_(
            progressRow
              .mixed_quiz_completed
          )
        : false
  };
}