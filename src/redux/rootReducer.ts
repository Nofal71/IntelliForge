import { combineReducers } from '@reduxjs/toolkit';
import chatbotReducer from './slices/chatbotSlice'; 

const rootReducer = combineReducers({
  chatbot: chatbotReducer 
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;