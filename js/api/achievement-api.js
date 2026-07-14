import{apiClient}from'./api-client.js';
export const achievementApi={getAchievements:()=>apiClient.post('getAchievements')};