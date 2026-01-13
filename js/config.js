// Google API Configuration
const CONFIG = {
    apiKey: 'AIzaSyAnr3RaSINp--olV2tjWhB4vWzN1_zgvQs',
    clientId: '439606055010-godfno1hpid9edoqh09cd84s58q2jfra.apps.googleusercontent.com',
    spreadsheetId: '1TF5CbNwP6RvNm9lS6cN7iq7kb9NQeOwOHJn8CVvxcGM',
    folderId: '1njBzkO9b4NeOVTpJiHNxhuQN7xzze5J0',

    // API scopes
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
    ].join(' '),

    // Discovery docs
    discoveryDocs: [
        'https://sheets.googleapis.com/$discovery/rest?version=v4',
        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
    ]
};
