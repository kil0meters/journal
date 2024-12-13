# journal app

This is my capstone project for Chico State. It is aimed at streamlining my
existing workflow for journaling using [Obsidian](https://obsidian.md).

This is a journaling app designed around a very particular workflow. Every day
has a single entry, and there are photos associated with that entry.
Additionally, there is a separate tab containing "people" where you can store
each of your friends' pictures and names.

The app will then automatically tag daily journal entries using facial
recognition and name mentions. You can then easily view each day where you
interacted with any given person.

| entry view                                                                                     | person view                                                                              |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| ![entry view](https://github.com/user-attachments/assets/f4bfa7b3-bc2c-4dcd-ae1e-71e85f83813e) | ![face](https://github.com/user-attachments/assets/5b4cec2c-76f2-482e-a210-3d3f5037e5db) |

The app also acts as a competitor to services like Google Photos, as it stores all of your photos on the server.

## Running the App

The app needs to be significantly more polished before publishing to the App Store, but you can run it locally as follows:

1. Install dependencies

   ```bash
   npm install
   cd server
   python -m venv venv
   # === activate venv ===
   pip install setuptools pillow pillow-heif pillow-avif-plugin face_recognition opencv-python
   ```

2. Start the server

   ```bash
   cd server
   JWT_KEY="some_secret" cargo run
   ```

3. Start the app

   ```bash
   npx expo start
   ```
