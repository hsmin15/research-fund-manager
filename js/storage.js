// Data Storage Management - Google Sheets Version
const STORAGE_KEY = 'researchFundData';

// Professor ID mapping
const PROFESSOR_MAP = {
    'choi': '최준정',
    'lim': '임선민'
};

// Initialize data structure
async function initializeData() {
    if (!isAuthorized()) {
        // Fallback to localStorage if not authorized
        return getLocalStorageData();
    }

    // Get budget data from Sheets
    const budgetData = await readSheetData('예산정보', 'A2:D10');

    const data = {
        professors: {}
    };

    // Initialize professors
    for (const [id, name] of Object.entries(PROFESSOR_MAP)) {
        const budgetRow = budgetData.find(row => row[0] === id);

        data.professors[id] = {
            id: id,
            name: name,
            totalBudget: budgetRow ? parseFloat(budgetRow[2] || 0) + parseFloat(budgetRow[3] || 0) : 10000000,
            activityBudget: budgetRow ? parseFloat(budgetRow[2] || 0) : 5000000,
            materialsBudget: budgetRow ? parseFloat(budgetRow[3] || 0) : 5000000,
            expenses: {
                meetingPre: [],
                meeting: [],
                activityPre: [],
                activity: [],
                materialsPre: [],
                materials: []
            }
        };
    }

    // If no budget data exists, initialize it
    if (budgetData.length === 0) {
        await initializeBudgetData();
    }

    return data;
}

// Initialize budget data in Sheets
async function initializeBudgetData() {
    const values = [
        ['choi', '최준정', 5000000, 5000000],
        ['lim', '임선민', 5000000, 5000000]
    ];

    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: CONFIG.spreadsheetId,
        range: '예산정보!A2',
        valueInputOption: 'RAW',
        resource: { values: values }
    });
}

// Fallback to localStorage
function getLocalStorageData() {
    const existingData = localStorage.getItem(STORAGE_KEY);

    if (!existingData) {
        const initialData = {
            professors: {
                choi: {
                    id: 'choi',
                    name: '최준정',
                    totalBudget: 10000000,
                    activityBudget: 5000000,
                    materialsBudget: 5000000,
                    expenses: {
                        meetingPre: [],
                        meeting: [],
                        activityPre: [],
                        activity: [],
                        materialsPre: [],
                        materials: []
                    }
                },
                lim: {
                    id: 'lim',
                    name: '임선민',
                    totalBudget: 10000000,
                    activityBudget: 5000000,
                    materialsBudget: 5000000,
                    expenses: {
                        meetingPre: [],
                        meeting: [],
                        activityPre: [],
                        activity: [],
                        materialsPre: [],
                        materials: []
                    }
                }
            }
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
        return initialData;
    }

    return JSON.parse(existingData);
}

// Get all data
async function getData() {
    return await initializeData();
}

// Save data (not used in Sheets version, kept for compatibility)
function saveData(data) {
    if (!isAuthorized()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
}

// Get professor data
async function getProfessorData(professorId) {
    const data = await getData();
    const professor = data.professors[professorId];

    if (!isAuthorized()) {
        return professor;
    }

    // Load expenses from Sheets
    const [meetingPreData, activityData, materialsData] = await Promise.all([
        readSheetData('회의비사전신청', 'A2:E1000'),
        readSheetData('연구활동비', 'A2:J1000'),
        readSheetData('연구재료비', 'A2:L1000')
    ]);

    // Parse meeting pre expenses
    professor.expenses.meetingPre = meetingPreData
        .filter(row => row[1] === professorId)
        .map(row => ({
            id: row[0],
            uploadDate: row[2],
            files: [{
                id: row[3],
                name: row[4],
                url: `https://drive.google.com/file/d/${row[3]}/view`
            }]
        }));

    // Parse activity expenses
    professor.expenses.activity = activityData
        .filter(row => row[1] === professorId)
        .map(row => ({
            id: row[0],
            category: row[2],
            description: row[3],
            card: row[4],
            paymentDate: row[5],
            totalAmount: parseFloat(row[6] || 0),
            taxableAmount: parseFloat(row[7] || 0),
            vat: parseFloat(row[8] || 0),
            createdAt: row[9]
        }));

    // Parse materials expenses
    professor.expenses.materials = materialsData
        .filter(row => row[1] === professorId)
        .map(row => ({
            id: row[0],
            category: row[2],
            description: row[3],
            card: row[4],
            paymentDate: row[5],
            unitPrice: parseFloat(row[6] || 0),
            quantity: parseFloat(row[7] || 0),
            totalAmount: parseFloat(row[8] || 0),
            taxableAmount: parseFloat(row[9] || 0),
            vat: parseFloat(row[10] || 0),
            createdAt: row[11]
        }));

    return professor;
}

// Update professor budget
async function updateBudget(professorId, activityBudget, materialsBudget) {
    if (!isAuthorized()) {
        const data = getData();
        data.professors[professorId].activityBudget = activityBudget;
        data.professors[professorId].materialsBudget = materialsBudget;
        data.professors[professorId].totalBudget = activityBudget + materialsBudget;
        saveData(data);
        return;
    }

    // Update in Sheets
    const budgetData = await readSheetData('예산정보', 'A2:D10');
    const rowIndex = budgetData.findIndex(row => row[0] === professorId);

    if (rowIndex >= 0) {
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: CONFIG.spreadsheetId,
            range: `예산정보!C${rowIndex + 2}:D${rowIndex + 2}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[activityBudget, materialsBudget]]
            }
        });
    }
}

// Add expense
async function addExpense(professorId, category, expense) {
    const expenseId = Date.now().toString();
    expense.id = expenseId;
    expense.createdAt = new Date().toISOString();

    if (!isAuthorized()) {
        const data = await getData();
        data.professors[professorId].expenses[category].push(expense);
        saveData(data);
        return expenseId;
    }

    // Add to Sheets based on category
    if (category === 'meetingPre') {
        // Handle file upload first
        if (expense.files && expense.files.length > 0) {
            const fileInfo = expense.files[0]; // Assuming single file for now
            const values = [
                expenseId,
                professorId,
                expense.uploadDate,
                fileInfo.id,
                fileInfo.name
            ];
            await appendSheetData('회의비사전신청', values);
        }
    } else if (category === 'activity') {
        const values = [
            expenseId,
            professorId,
            expense.category,
            expense.description,
            expense.card,
            expense.paymentDate,
            expense.totalAmount,
            expense.taxableAmount || 0,
            expense.vat || 0,
            expense.createdAt
        ];
        await appendSheetData('연구활동비', values);
    } else if (category === 'materials') {
        const values = [
            expenseId,
            professorId,
            expense.category,
            expense.description,
            expense.card,
            expense.paymentDate,
            expense.unitPrice,
            expense.quantity,
            expense.totalAmount,
            expense.taxableAmount || 0,
            expense.vat || 0,
            expense.createdAt
        ];
        await appendSheetData('연구재료비', values);
    }

    return expenseId;
}

// Delete expense
async function deleteExpense(professorId, category, expenseId) {
    if (!isAuthorized()) {
        const data = await getData();
        const expenses = data.professors[professorId].expenses[category];
        const index = expenses.findIndex(e => e.id === expenseId);
        if (index > -1) {
            expenses.splice(index, 1);
            saveData(data);
            return true;
        }
        return false;
    }

    // Delete from Sheets
    let sheetName = '';
    if (category === 'meetingPre') sheetName = '회의비사전신청';
    else if (category === 'activity') sheetName = '연구활동비';
    else if (category === 'materials') sheetName = '연구재료비';

    if (sheetName) {
        const data = await readSheetData(sheetName, 'A2:A1000');
        const rowIndex = data.findIndex(row => row[0] === expenseId);
        if (rowIndex >= 0) {
            await deleteSheetRow(sheetName, rowIndex + 1); // +1 for header
            return true;
        }
    }

    return false;
}

// Calculate totals
async function calculateTotals(professorId) {
    const professor = await getProfessorData(professorId);

    const meetingTotal = professor.expenses.meeting.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const activityTotal = professor.expenses.activity.reduce((sum, e) => sum + parseFloat(e.totalAmount || 0), 0);
    const materialsTotal = professor.expenses.materials.reduce((sum, e) => sum + parseFloat(e.totalAmount || 0), 0);

    // 연구활동비 = 회의비 + 연구활동비(회의비 외)
    const activitySpent = meetingTotal + activityTotal;
    const activityRemaining = professor.activityBudget - activitySpent;

    // 연구재료비
    const materialsSpent = materialsTotal;
    const materialsRemaining = professor.materialsBudget - materialsSpent;

    const totalSpent = activitySpent + materialsSpent;
    const totalBudget = professor.activityBudget + professor.materialsBudget;
    const remaining = totalBudget - totalSpent;

    return {
        // 전체 예산
        totalBudget: totalBudget,
        totalSpent,
        remaining,

        // 연구활동비 (회의비 + 연구활동비)
        activityBudget: professor.activityBudget,
        activitySpent,
        activityRemaining,
        meetingTotal,
        activityTotal,

        // 연구재료비
        materialsBudget: professor.materialsBudget,
        materialsSpent,
        materialsRemaining,
        materialsTotal
    };
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW'
    }).format(amount);
}

// Handle file upload - Modified for Google Drive
async function handleFileUpload(fileInput) {
    const files = fileInput.files;
    if (!files || files.length === 0) return [];

    if (!isAuthorized()) {
        // Fallback to base64 encoding
        return handleFileUploadLocal(fileInput);
    }

    // Upload to Google Drive
    const uploadedFiles = [];
    for (const file of files) {
        try {
            const fileInfo = await uploadFileToDrive(file);
            uploadedFiles.push(fileInfo);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    }

    return uploadedFiles;
}

// Local file upload (base64)
async function handleFileUploadLocal(fileInput) {
    const files = fileInput.files;
    if (!files || files.length === 0) return [];

    const filePromises = Array.from(files).map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    });

    return Promise.all(filePromises);
}

// Download file
function downloadFile(fileData) {
    if (fileData.url) {
        // Google Drive file
        window.open(fileData.url, '_blank');
    } else {
        // Base64 file
        const link = document.createElement('a');
        link.href = fileData.data;
        link.download = fileData.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
