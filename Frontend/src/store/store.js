import { configureStore } from '@reduxjs/toolkit'

import userReducer from "./userSlice";
import adReducer from "./adSlice";
import singleAdReducer from "./singleAdSlice";


export const store = configureStore({
  reducer: {
    users: userReducer,
    ads: adReducer,
    singleAd: singleAdReducer
  }
})
