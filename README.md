After clone, run 'npm i' first.

To run app:
npx expo start

To build android apk:

1.  Delete existing eas.jon folder in root directory
2.  run 'eas login' and login, skip login if already done
3.  run 'eas build:configure'
4.  run 'eas build --platform android --profile preview'
