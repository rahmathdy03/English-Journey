/**
 * Converts a spreadsheet date value into YYYY-MM-DD format.
 *
 * Google Sheets can return a date as:
 * - a Date object,
 * - a YYYY-MM-DD string,
 * - a full date-time string.
 *
 * @param {*} value
 * @returns {string}
 */
function normalizeAnalyticsDate_(value) {
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

  if (!text) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parsedDate = new Date(text);

  if (!isNaN(parsedDate.getTime())) {
    return dateKey_(parsedDate);
  }

  return text.slice(0, 10);
}

/**
 * Returns the user's public progress statistics.
 *
 * @param {Object} user
 * @returns {Object}
 */
function publicUserStats_(user) {
  const dailyProgress = valuesAsObjects_(
    "DailyProgress"
  ).filter(function (row) {
    return (
      String(row.user_id) ===
        String(user.user_id) &&
      bool_(row.daily_completed)
    );
  });

  return {
    userId: user.user_id,
    displayName: user.display_name,
    avatar: user.avatar,

    currentStreak: Number(
      user.current_streak || 0
    ),

    bestStreak: Number(
      user.best_streak || 0
    ),

    totalWords: Number(
      user.total_words || 0
    ),

    masteredWords: Number(
      user.mastered_words || 0
    ),

    grammarAccuracy: Number(
      user.grammar_accuracy || 0
    ),

    averageScore: Number(
      user.average_score || 0
    ),

    weeklyChallengeScore:
      lastWeeklyScore_(user.user_id),

    lessonsCompleted: dailyProgress.length
  };
}

/**
 * Returns the latest completed Weekly Challenge score.
 *
 * @param {string} userId
 * @returns {number}
 */
function lastWeeklyScore_(userId) {
  const weeklyProgress =
    valuesAsObjects_("WeeklyProgress")
      .filter(function (row) {
        return (
          String(row.user_id) ===
            String(userId) &&
          bool_(row.challenge_completed)
        );
      })
      .sort(function (first, second) {
        return (
          Number(second.week) -
          Number(first.week)
        );
      });

  return weeklyProgress.length
    ? Number(
        weeklyProgress[0].final_score || 0
      )
    : 0;
}

/**
 * Returns dashboard data for the authenticated user.
 *
 * @param {Object} user
 * @returns {Object}
 */
function getDashboard_(user) {
  const currentHour = new Date().getHours();

  let greeting = "Good evening";

  if (currentHour < 12) {
    greeting = "Good morning";
  } else if (currentHour < 18) {
    greeting = "Good afternoon";
  }

  const currentWeek = Number(
    user.current_week || 1
  );

  const currentDay = Number(
    user.current_day || 1
  );

  const dailyProgress =
    currentDay <= 6
      ? dailyRow_(
          user.user_id,
          currentWeek,
          currentDay,
          false
        )
      : null;

  const weekContent =
    LESSON_DATA[currentWeek] || null;

  const todayContent =
    currentDay <= 6 && weekContent
      ? weekContent.days.find(
          function (dayContent) {
            return (
              Number(dayContent.day) ===
              currentDay
            );
          }
        )
      : null;

  const partner = findOne_(
    "Users",
    function (row) {
      return (
        String(row.user_id) !==
        String(user.user_id)
      );
    }
  );

  return {
    greeting: greeting,

    user: {
      displayName: user.display_name,
      avatar: user.avatar
    },

    progress: publicUserStats_(user),

    today: Object.assign(
      {
        week: currentWeek,
        day: currentDay,

        title:
          currentDay === 7
            ? "Weekly Challenge"
            : todayContent
              ? todayContent.title
              : "New content coming soon",

        subtitle:
          currentDay === 7
            ? "Review all this week’s material."
            : "Five words, one grammar topic, and practice."
      },
      progressStatus_(dailyProgress)
    ),

    partner: partner
      ? publicUserStats_(partner)
      : null,

    coupleMessage: coupleMessage_()
  };
}

/**
 * Returns a motivational message based on both users' progress.
 *
 * @returns {string}
 */
function coupleMessage_() {
  const users = valuesAsObjects_("Users");

  const bothStarted = users.length > 0 &&
    users.every(function (user) {
      return Number(user.total_words || 0) > 0;
    });

  if (bothStarted) {
    return (
      "You are building this habit together—" +
      "one word at a time."
    );
  }

  return (
    "Start the first lesson and grow together."
  );
}

/**
 * Returns detailed progress information.
 *
 * @param {Object} user
 * @returns {Object}
 */
function getProgress_(user) {
  const dailyProgress =
    valuesAsObjects_("DailyProgress")
      .filter(function (row) {
        return (
          String(row.user_id) ===
            String(user.user_id) &&
          bool_(row.daily_completed)
        );
      })
      .sort(function (first, second) {
        return normalizeAnalyticsDate_(
          second.date
        ).localeCompare(
          normalizeAnalyticsDate_(first.date)
        );
      });

  const learningHistory =
    valuesAsObjects_("LearningHistory")
      .filter(function (row) {
        return (
          String(row.user_id) ===
          String(user.user_id)
        );
      })
      .sort(function (first, second) {
        return String(
          first.created_at || ""
        ).localeCompare(
          String(second.created_at || "")
        );
      });

  const currentUser = findOne_(
    "Users",
    function (row) {
      return (
        String(row.user_id) ===
        String(user.user_id)
      );
    }
  );

  const summary =
    publicUserStats_(currentUser || user);

  const uniqueStudyDates = new Set();

  dailyProgress.forEach(function (row) {
    const normalizedDate =
      normalizeAnalyticsDate_(row.date);

    if (normalizedDate) {
      uniqueStudyDates.add(normalizedDate);
    }
  });

  summary.totalStudyDays =
    uniqueStudyDates.size;

  summary.totalQuizCompleted =
    learningHistory.length;

  return {
    summary: summary,

    chart: learningHistory
      .slice(-14)
      .map(function (history) {
        const quizType = String(
          history.quiz_type || "quiz"
        );

        return {
          label:
            "D" +
            history.day +
            " " +
            quizType
              .slice(0, 1)
              .toUpperCase(),

          score: Number(
            history.score || 0
          )
        };
      }),

    activity: dailyProgress
      .slice(0, 10)
      .map(function (progress) {
        return {
          date: normalizeAnalyticsDate_(
            progress.date
          ),

          week: Number(
            progress.week || 0
          ),

          day: Number(
            progress.day || 0
          ),

          finalScore: dailyAverage_(
            user.user_id,
            progress.week,
            progress.day
          )
        };
      })
  };
}

/**
 * Calculates the average quiz score for one learning day.
 *
 * @param {string} userId
 * @param {number} week
 * @param {number} day
 * @returns {number}
 */
function dailyAverage_(userId, week, day) {
  const history =
    valuesAsObjects_("LearningHistory")
      .filter(function (row) {
        return (
          String(row.user_id) ===
            String(userId) &&
          Number(row.week) ===
            Number(week) &&
          Number(row.day) ===
            Number(day)
        );
      });

  if (!history.length) {
    return 0;
  }

  const totalScore = history.reduce(
    function (total, row) {
      return total + Number(row.score || 0);
    },
    0
  );

  return totalScore / history.length;
}

/**
 * Returns progress comparison for both users.
 *
 * @returns {Object}
 */
function getCompareProgress_() {
  const users = valuesAsObjects_("Users")
    .map(function (user) {
      const stats = publicUserStats_(user);

      stats.encouragement =
        stats.currentStreak > 0
          ? "Keep the habit going."
          : "Today is a good day to begin.";

      return stats;
    });

  let message =
    "You are both moving forward.";

  if (
    users.length === 2 &&
    users[0].averageScore !==
      users[1].averageScore
  ) {
    const leadingUser =
      users[0].averageScore >
      users[1].averageScore
        ? users[0]
        : users[1];

    message =
      leadingUser.displayName +
      " is leading today, while both " +
      "journeys keep growing.";
  }

  return {
    users: users,

    message: message,

    submessage:
      "Celebrate improvements and help " +
      "each other finish the week."
  };
}

/**
 * Returns calendar activity for a selected month.
 *
 * Levels:
 * 0 = not studied
 * 1 = partially studied
 * 2 = lesson completed
 * 3 = Weekly Challenge completed
 *
 * @param {Object} user
 * @param {Object} payload
 * @returns {Object}
 */
function getCalendar_(user, payload) {
  const year = requireInteger_(
    payload.year,
    "year",
    2020,
    2100
  );

  const month = requireInteger_(
    payload.month,
    "month",
    1,
    12
  );

  const firstDate = new Date(
    year,
    month - 1,
    1
  );

  const lastDate = new Date(
    year,
    month,
    0
  );

  const dailyRows =
    valuesAsObjects_("DailyProgress")
      .filter(function (row) {
        return (
          String(row.user_id) ===
          String(user.user_id)
        );
      });

  const weeklyRows =
    valuesAsObjects_("WeeklyProgress")
      .filter(function (row) {
        return (
          String(row.user_id) ===
          String(user.user_id)
        );
      });

  const dailyByDate = {};

  dailyRows.forEach(function (row) {
    const normalizedDate =
      normalizeAnalyticsDate_(row.date);

    if (!normalizedDate) {
      return;
    }

    /*
     * If several progress rows exist on one date,
     * preserve the row with the highest progress.
     */
    const existing =
      dailyByDate[normalizedDate];

    if (!existing) {
      dailyByDate[normalizedDate] = row;
      return;
    }

    const existingStatus =
      progressStatus_(existing);

    const currentStatus =
      progressStatus_(row);

    const existingLevel =
      existingStatus.dailyCompleted
        ? 2
        : (
            existingStatus.vocabularyCompleted ||
            existingStatus.grammarCompleted ||
            existingStatus.practiceCompleted
          )
          ? 1
          : 0;

    const currentLevel =
      currentStatus.dailyCompleted
        ? 2
        : (
            currentStatus.vocabularyCompleted ||
            currentStatus.grammarCompleted ||
            currentStatus.practiceCompleted
          )
          ? 1
          : 0;

    if (currentLevel > existingLevel) {
      dailyByDate[normalizedDate] = row;
    }
  });

  const weeklyByDate = {};

  weeklyRows.forEach(function (row) {
    if (!bool_(row.challenge_completed)) {
      return;
    }

    const normalizedDate =
      normalizeAnalyticsDate_(
        row.completed_at
      );

    if (normalizedDate) {
      weeklyByDate[normalizedDate] = row;
    }
  });

  const days = [];

  for (
    let dayNumber = 1;
    dayNumber <= lastDate.getDate();
    dayNumber++
  ) {
    const currentDate = new Date(
      year,
      month - 1,
      dayNumber
    );

    const dateKey =
      dateKey_(currentDate);

    const dailyRow =
      dailyByDate[dateKey];

    const weeklyRow =
      weeklyByDate[dateKey];

    let level = 0;
    let label = "Not studied";

    if (dailyRow) {
      const status =
        progressStatus_(dailyRow);

      if (status.dailyCompleted) {
        level = 2;
        label = "Lesson completed";
      } else if (
        status.vocabularyCompleted ||
        status.grammarCompleted ||
        status.practiceCompleted
      ) {
        level = 1;
        label = "Partially studied";
      }
    }

    if (weeklyRow) {
      level = 3;
      label =
        "Weekly Challenge completed";
    }

    days.push({
      day: dayNumber,
      date: dateKey,
      level: level,
      label: label
    });
  }

  /*
   * Calendar starts on Monday:
   * Monday = 0, Sunday = 6.
   */
  const leadingBlank =
    (firstDate.getDay() + 6) % 7;

  return {
    monthLabel:
      firstDate.toLocaleString(
        "en-US",
        {
          month: "long",
          year: "numeric"
        }
      ),

    leadingBlank: leadingBlank,
    days: days
  };
}

/**
 * Returns shared progress for both users.
 *
 * @returns {Object}
 */
function getCoupleGoal_() {
  const users =
    valuesAsObjects_("Users");

  const dailyProgress =
    valuesAsObjects_("DailyProgress")
      .filter(function (row) {
        return bool_(row.daily_completed);
      });

  const weeklyProgress =
    valuesAsObjects_("WeeklyProgress")
      .filter(function (row) {
        return bool_(
          row.challenge_completed
        );
      });

  const totalVocabulary =
    users.reduce(
      function (total, user) {
        return (
          total +
          Number(user.total_words || 0)
        );
      },
      0
    );

  const averageScore =
    users.length
      ? users.reduce(
          function (total, user) {
            return (
              total +
              Number(
                user.average_score || 0
              )
            );
          },
          0
        ) / users.length
      : 0;

  const vocabularyTarget =
    users.reduce(
      function (total, user) {
        return (
          total +
          Number(
            user.vocabulary_target || 300
          )
        );
      },
      0
    );

  const uniqueStudyDates = new Set();

  dailyProgress.forEach(function (row) {
    const normalizedDate =
      normalizeAnalyticsDate_(row.date);

    if (normalizedDate) {
      uniqueStudyDates.add(
        normalizedDate
      );
    }
  });

  const completedWeeks = new Set();

  weeklyProgress.forEach(function (row) {
    if (row.week !== "") {
      completedWeeks.add(
        Number(row.week)
      );
    }
  });

  const bothUsersHaveStudied =
    APP_CONFIG.USERS.every(
      function (configuredUser) {
        return dailyProgress.some(
          function (row) {
            return (
              String(row.user_id) ===
              String(
                configuredUser.userId
              )
            );
          }
        );
      }
    );

  return {
    totalVocabulary: totalVocabulary,

    totalStudyDays:
      uniqueStudyDates.size,

    combinedStreak:
      users.reduce(
        function (total, user) {
          return (
            total +
            Number(
              user.current_streak || 0
            )
          );
        },
        0
      ),

    weeksCompleted:
      completedWeeks.size,

    averageScore: averageScore,

    coupleAchievements:
      bothUsersHaveStudied ? 1 : 0,

    message:
      "Learn together. Grow together.",

    motivation: coupleMessage_(),

    goal: {
      current: totalVocabulary,
      target: vocabularyTarget,

      percent:
        vocabularyTarget > 0
          ? (
              totalVocabulary /
              vocabularyTarget
            ) * 100
          : 0
    }
  };
}