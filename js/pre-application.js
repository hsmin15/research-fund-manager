// Meeting Pre-Application
async function saveMeetingPre(event) {
    event.preventDefault();
    const form = event.target;

    // Handle file upload
    const fileInput = document.getElementById('meeting-pre-file');
    const files = await handleFileUpload(fileInput);

    const expense = {
        files: files,
        uploadDate: new Date().toISOString()
    };

    addExpense(currentProfessorId, 'meetingPre', expense);

    // Reset form
    form.reset();

    // Reload
    loadMeetingPreHistory();

    alert('회의비 사전신청 파일이 저장되었습니다.');
}

function loadMeetingPreHistory() {
    const professor = getProfessorData(currentProfessorId);
    const expenses = professor.expenses.meetingPre || [];
    const container = document.getElementById('meeting-pre-history');

    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-state">등록된 회의비 사전신청 내역이 없습니다.</div>';
        return;
    }

    container.innerHTML = expenses.map(expense => {
        const uploadDate = new Date(expense.uploadDate).toLocaleString('ko-KR');
        return `
        <div class="history-item">
            <div class="history-header">
                <span class="history-date">업로드: ${uploadDate}</span>
            </div>
            ${expense.files && expense.files.length > 0 ? `
                <div class="history-files">
                    <strong>첨부파일:</strong>
                    ${expense.files.map((file, idx) => `
                        <a href="#" class="file-link" onclick="downloadFile(${JSON.stringify(file).replace(/"/g, '&quot;')}); return false;">
                            📎 ${file.name}
                        </a>
                    `).join('')}
                </div>
            ` : ''}
            <button class="btn-delete" onclick="deleteMeetingPreExpense('${expense.id}')">삭제</button>
        </div>
    `}).join('');
}

function deleteMeetingPreExpense(expenseId) {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
        deleteExpense(currentProfessorId, 'meetingPre', expenseId);
        loadMeetingPreHistory();
    }
}

// Activity Pre-Application
async function saveActivityPre(event) {
    event.preventDefault();
    const form = event.target;

    // Handle file upload
    const fileInput = document.getElementById('activity-pre-file');
    const files = await handleFileUpload(fileInput);

    const expense = {
        files: files,
        uploadDate: new Date().toISOString()
    };

    addExpense(currentProfessorId, 'activityPre', expense);

    // Reset form
    form.reset();

    // Reload
    loadActivityPreHistory();

    alert('연구활동비 사전신청 파일이 저장되었습니다.');
}

function loadActivityPreHistory() {
    const professor = getProfessorData(currentProfessorId);
    const expenses = professor.expenses.activityPre || [];
    const container = document.getElementById('activity-pre-history');

    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-state">등록된 연구활동비 사전신청 내역이 없습니다.</div>';
        return;
    }

    container.innerHTML = expenses.map(expense => {
        const uploadDate = new Date(expense.uploadDate).toLocaleString('ko-KR');
        return `
        <div class="history-item">
            <div class="history-header">
                <span class="history-date">업로드: ${uploadDate}</span>
            </div>
            ${expense.files && expense.files.length > 0 ? `
                <div class="history-files">
                    <strong>첨부파일:</strong>
                    ${expense.files.map((file, idx) => `
                        <a href="#" class="file-link" onclick="downloadFile(${JSON.stringify(file).replace(/"/g, '&quot;')}); return false;">
                            📎 ${file.name}
                        </a>
                    `).join('')}
                </div>
            ` : ''}
            <button class="btn-delete" onclick="deleteActivityPreExpense('${expense.id}')">삭제</button>
        </div>
    `}).join('');
}

function deleteActivityPreExpense(expenseId) {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
        deleteExpense(currentProfessorId, 'activityPre', expenseId);
        loadActivityPreHistory();
    }
}

// Materials Pre-Application
async function saveMaterialsPre(event) {
    event.preventDefault();
    const form = event.target;

    // Handle file upload
    const fileInput = document.getElementById('materials-pre-file');
    const files = await handleFileUpload(fileInput);

    const expense = {
        files: files,
        uploadDate: new Date().toISOString()
    };

    addExpense(currentProfessorId, 'materialsPre', expense);

    // Reset form
    form.reset();

    // Reload
    loadMaterialsPreHistory();

    alert('연구재료비 사전신청 파일이 저장되었습니다.');
}

function loadMaterialsPreHistory() {
    const professor = getProfessorData(currentProfessorId);
    const expenses = professor.expenses.materialsPre || [];
    const container = document.getElementById('materials-pre-history');

    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-state">등록된 연구재료비 사전신청 내역이 없습니다.</div>';
        return;
    }

    container.innerHTML = expenses.map(expense => {
        const uploadDate = new Date(expense.uploadDate).toLocaleString('ko-KR');
        return `
        <div class="history-item">
            <div class="history-header">
                <span class="history-date">업로드: ${uploadDate}</span>
            </div>
            ${expense.files && expense.files.length > 0 ? `
                <div class="history-files">
                    <strong>첨부파일:</strong>
                    ${expense.files.map((file, idx) => `
                        <a href="#" class="file-link" onclick="downloadFile(${JSON.stringify(file).replace(/"/g, '&quot;')}); return false;">
                            📎 ${file.name}
                        </a>
                    `).join('')}
                </div>
            ` : ''}
            <button class="btn-delete" onclick="deleteMaterialsPreExpense('${expense.id}')">삭제</button>
        </div>
    `}).join('');
}

function deleteMaterialsPreExpense(expenseId) {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
        deleteExpense(currentProfessorId, 'materialsPre', expenseId);
        loadMaterialsPreHistory();
    }
}
