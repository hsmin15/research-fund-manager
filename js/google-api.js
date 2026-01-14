// Google API Integration Module
let gapiInited = false;
let gisInited = false;
let tokenClient;
let accessToken = null;

// Initialize Google API
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: CONFIG.apiKey,
        discoveryDocs: CONFIG.discoveryDocs,
    });
    gapiInited = true;
    maybeEnableButtons();
}

// Initialize Google Identity Services
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.clientId,
        scope: CONFIG.scopes,
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize-button')?.removeAttribute('disabled');
    }
}

// Handle authorization
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        accessToken = gapi.client.getToken().access_token;
        document.getElementById('signout-button')?.removeAttribute('disabled');
        document.getElementById('authorize-button')?.setAttribute('disabled', 'true');

        // Hide auth section, show main content
        document.getElementById('auth-section')?.classList.add('hidden');
        document.getElementById('main-content')?.classList.remove('hidden');

        // Initialize data
        await initializeGoogleSheets();

        // Load page data
        if (typeof loadProfessorCards === 'function') {
            loadProfessorCards();
        }
        if (typeof loadProfessorPage === 'function') {
            loadProfessorPage();
        }
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Handle sign out
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        accessToken = null;

        document.getElementById('authorize-button')?.removeAttribute('disabled');
        document.getElementById('signout-button')?.setAttribute('disabled', 'true');

        // Show auth section, hide main content
        document.getElementById('auth-section')?.classList.remove('hidden');
        document.getElementById('main-content')?.classList.add('hidden');
    }
}

// Initialize Google Sheets structure
async function initializeGoogleSheets() {
    try {
        // Check if sheets exist, if not create them
        const response = await gapi.client.sheets.spreadsheets.get({
            spreadsheetId: CONFIG.spreadsheetId
        });

        const sheets = response.result.sheets;
        const sheetNames = sheets.map(s => s.properties.title);

        // Create sheets if they don't exist
        const requiredSheets = ['회의비사전신청', '연구활동비', '연구재료비', '예산정보'];
        const requests = [];

        for (const sheetName of requiredSheets) {
            if (!sheetNames.includes(sheetName)) {
                requests.push({
                    addSheet: {
                        properties: {
                            title: sheetName
                        }
                    }
                });
            }
        }

        if (requests.length > 0) {
            await gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: CONFIG.spreadsheetId,
                resource: {
                    requests: requests
                }
            });
        }

        // Initialize headers
        await initializeSheetHeaders();

    } catch (error) {
        console.error('Error initializing sheets:', error);
    }
}

// Initialize sheet headers
async function initializeSheetHeaders() {
    const updates = [
        {
            range: '회의비사전신청!A1:E1',
            values: [['ID', '교수ID', '업로드날짜', '파일ID', '파일이름']]
        },
        {
            range: '연구활동비!A1:J1',
            values: [['ID', '교수ID', '구분', '사용내역', '사용카드', '결제일', '총금액', '과세금액', '부가세', '생성일']]
        },
        {
            range: '연구재료비!A1:L1',
            values: [['ID', '교수ID', '구분', '사용내역', '사용카드', '결제일', '단가', '개수', '총금액', '과세금액', '부가세', '생성일']]
        },
        {
            range: '예산정보!A1:D1',
            values: [['교수ID', '교수명', '연구활동비예산', '연구재료비예산']]
        }
    ];

    try {
        await gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: CONFIG.spreadsheetId,
            resource: {
                valueInputOption: 'RAW',
                data: updates
            }
        });
    } catch (error) {
        console.error('Error initializing headers:', error);
    }
}

// Read data from sheet
async function readSheetData(sheetName, range = '') {
    try {
        const fullRange = range ? `${sheetName}!${range}` : sheetName;
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.spreadsheetId,
            range: fullRange
        });
        return response.result.values || [];
    } catch (error) {
        console.error('Error reading sheet:', error);
        return [];
    }
}

// Append data to sheet
async function appendSheetData(sheetName, values) {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.spreadsheetId,
            range: `${sheetName}!A:A`,
            valueInputOption: 'RAW',
            resource: {
                values: [values]
            }
        });
        return response.result;
    } catch (error) {
        console.error('Error appending to sheet:', error);
        throw error;
    }
}

// Delete row from sheet
async function deleteSheetRow(sheetName, rowIndex) {
    try {
        // Get sheet ID
        const response = await gapi.client.sheets.spreadsheets.get({
            spreadsheetId: CONFIG.spreadsheetId
        });

        const sheet = response.result.sheets.find(s => s.properties.title === sheetName);
        if (!sheet) return;

        const sheetId = sheet.properties.sheetId;

        await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: CONFIG.spreadsheetId,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex,
                            endIndex: rowIndex + 1
                        }
                    }
                }]
            }
        });
    } catch (error) {
        console.error('Error deleting row:', error);
        throw error;
    }
}

// Upload file to Google Drive
async function uploadFileToDrive(file) {
    try {
        const metadata = {
            name: file.name,
            mimeType: file.type,
            parents: [CONFIG.folderId]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: form
        });

        const result = await response.json();
        return {
            id: result.id,
            name: result.name,
            url: `https://drive.google.com/file/d/${result.id}/view`
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// Check if user is authorized
function isAuthorized() {
    try {
        // Check if gapi is loaded
        if (typeof gapi === 'undefined' || !gapi.client) {
            console.log('[DEBUG] gapi not loaded yet');
            return false;
        }

        const token = gapi.client.getToken();
        const authorized = token !== null && token !== undefined;
        console.log('[DEBUG] isAuthorized check:', { token: !!token, authorized });
        return authorized;
    } catch (error) {
        console.log('[DEBUG] isAuthorized error:', error.message);
        return false;
    }
}
