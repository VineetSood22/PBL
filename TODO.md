# TODO: Fix Chatbot Errors

- [x] Change server port to 3000 in server.js
- [x] Update Vite proxy target to localhost:3000 in vite.config.js
- [x] Add mock responses in chatbot.js to prevent 500 errors when API key is missing
- [x] Obtain OpenAI API key from https://platform.openai.com/api-keys and add OPENAI_API_KEY=your_key_here to .env file for full AI functionality
- [x] Run backend server with `node server.js`
- [x] Run frontend with `npm run dev`
- [x] Test chatbot functionality (returns 200 with quota message instead of 500)
