# API Documentation

All requests use `POST` with JSON text to the Apps Script `/exec` URL.

```json
{
  "action": "getDashboard",
  "sessionToken": "temporary-token"
}
```

Success:

```json
{"success":true,"message":"Request completed.","data":{}}
```

Error:

```json
{"success":false,"message":"Invalid or expired session.","errorCode":"AUTH_INVALID_SESSION","data":null}
```

## Public actions

- `login`: `userId`, `pin`
- `logout`: `sessionToken`

## Authenticated actions

- `getDashboard`
- `getDailyLesson`: optional `week`, `day`
- `completeVocabularyLesson`: `week`, `day`
- `completeGrammarLesson`: `week`, `day`
- `getQuiz`: `week`, `day`, `quizType`
- `submitQuiz`: `week`, `day`, `quizType`, `answers[]`
- `getResult`: `week`, `day`
- `getReviewList`
- `submitReview`: `itemType`, `itemId`, `correct`
- `getVocabularyLibrary`
- `getGrammarLibrary`
- `getProgress`
- `getCompareProgress`
- `getAchievements`
- `getWeeklyChallenge`: `week`
- `submitWeeklyChallenge`: `week`, `answers[]`
- `getCalendar`: `year`, `month`
- `getCoupleGoal`
- `getProfile`
- `updateProfile`: `displayName`, `avatar`, `dailyTarget`, `streakTarget`, `vocabularyTarget`
- `updatePin`: `currentPin`, `newPin`

## Important behavior

`submitQuiz` and `submitWeeklyChallenge` accept answers only. The backend obtains correct answers from `QuestionBank.gs`, shuffles public options, recalculates the score, and updates Google Sheets.
