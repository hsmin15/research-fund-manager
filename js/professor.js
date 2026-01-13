// Professor page logic
let currentProfessorId = null;
let currentTab = 'meeting';

document.addEventListener('DOMContentLoaded', () => {
    // Get professor ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentProfessorId = urlParams.get('id');

    if (!currentProfessorId) {
        alert('교수님 정보를 찾을 수 없습니다.');
        window.location.href = 'index.html';
        return;
    }

    loadProfessorPage();
});

function loadProfessorPage() {
    const professor = getProfessorData(currentProfessorId);

    // Set professor name
    document.getElementById('professor-name').textContent = professor.name + ' 교수님';

    // Update budget summary
    updateBudgetSummary();

    // Load all histories
    loadMeetingPreHistory();
    loadMeetingHistory();
    loadActivityHistory();
    loadMaterialsHistory();
}

function updateBudgetSummary() {
    const totals = calculateTotals(currentProfessorId);

    document.getElementById('total-budget').textContent = formatCurrency(totals.totalBudget);
    document.getElementById('total-spent').textContent = formatCurrency(totals.totalSpent);
    document.getElementById('remaining-budget').textContent = formatCurrency(totals.remaining);

    // 연구활동비 정보
    document.getElementById('activity-budget-total').textContent = formatCurrency(totals.activityBudget);
    document.getElementById('activity-budget-spent').textContent = formatCurrency(totals.activitySpent);
    document.getElementById('activity-budget-remaining').textContent = formatCurrency(totals.activityRemaining);

    // 연구재료비 정보
    document.getElementById('materials-budget-total').textContent = formatCurrency(totals.materialsBudget);
    document.getElementById('materials-budget-spent').textContent = formatCurrency(totals.materialsSpent);
    document.getElementById('materials-budget-remaining').textContent = formatCurrency(totals.materialsRemaining);

    // 카테고리별 상세 (기존)
    document.getElementById('meeting-total').textContent = formatCurrency(totals.meetingTotal);
    document.getElementById('activity-total').textContent = formatCurrency(totals.activityTotal);
    document.getElementById('materials-total').textContent = formatCurrency(totals.materialsTotal);
}

function goHome() {
    window.location.href = 'index.html';
}

function editBudget() {
    const professor = getProfessorData(currentProfessorId);
    const newActivityBudget = prompt('연구활동비 예산을 입력하세요:', professor.activityBudget);

    if (newActivityBudget === null) return;

    const newMaterialsBudget = prompt('연구재료비 예산을 입력하세요:', professor.materialsBudget);

    if (newMaterialsBudget === null) return;

    const activityBudgetNum = parseFloat(newActivityBudget);
    const materialsBudgetNum = parseFloat(newMaterialsBudget);

    if (!isNaN(activityBudgetNum) && activityBudgetNum >= 0 &&
        !isNaN(materialsBudgetNum) && materialsBudgetNum >= 0) {
        updateBudget(currentProfessorId, activityBudgetNum, materialsBudgetNum);
        updateBudgetSummary();
        alert('예산이 업데이트되었습니다.');
    } else {
        alert('올바른 금액을 입력해주세요.');
    }
}

// Tab switching
function switchTab(tabName) {
    currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-content`).classList.add('active');
}

// Meeting expenses
async function saveMeeting(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    // Handle file upload
    const fileInput = document.getElementById('meeting-file');
    const files = await handleFileUpload(fileInput);

    const expense = {
        date: formData.get('date'),
        location: formData.get('location'),
        card: formData.get('card'),
        paymentDate: formData.get('paymentDate'),
        meetingLocation: formData.get('meetingLocation'),
        meetingDateTime: formData.get('meetingDateTime'),
        content: formData.get('content'),
        attendees: formData.get('attendees'),
        externalAttendees: formData.get('externalAttendees'),
        amount: parseFloat(formData.get('amount')),
        files: files
    };

    addExpense(currentProfessorId, 'meeting', expense);

    // Reset form
    form.reset();

    // Reload
    loadMeetingHistory();
    updateBudgetSummary();

    alert('회의비가 저장되었습니다.');
}

function loadMeetingHistory() {
    const professor = getProfessorData(currentProfessorId);
    const expenses = professor.expenses.meeting;
    const container = document.getElementById('meeting-history');

    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-state">등록된 회의비 내역이 없습니다.</div>';
        return;
    }

    container.innerHTML = expenses.map(expense => `
        <div class="history-item">
            <div class="history-header">
                <span class="history-date">${expense.date} - ${expense.location}</span>
                <span class="history-amount">${formatCurrency(expense.amount)}</span>
            </div>
            <div class="history-details">
                <div class="history-detail"><strong>사용카드:</strong> ${expense.card}</div>
                <div class="history-detail"><strong>결제일:</strong> ${expense.paymentDate}</div>
                ${expense.meetingLocation ? `<div class="history-detail"><strong>회의장소:</strong> ${expense.meetingLocation}</div>` : ''}
                ${expense.attendees ? `<div class="history-detail"><strong>참석자:</strong> ${expense.attendees}</div>` : ''}
                ${expense.externalAttendees ? `<div class="history-detail"><strong>외부참석자:</strong> ${expense.externalAttendees}</div>` : ''}
            </div>
            ${expense.content ? `<div style="margin-top: 0.5rem; color: var(--text-secondary);"><strong>회의내용:</strong> ${expense.content}</div>` : ''}
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
            <button class="btn-delete" onclick="deleteMeetingExpense('${expense.id}')">삭제</button>
        </div>
    `).join('');
}

function deleteMeetingExpense(expenseId) {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
        deleteExpense(currentProfessorId, 'meeting', expenseId);
        loadMeetingHistory();
        updateBudgetSummary();
    }
}

// Research activity expenses
async function saveActivity(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const expense = {
        category: formData.get('category'),
        description: formData.get('description'),
        card: formData.get('card'),
        paymentDate: formData.get('paymentDate'),
        totalAmount: parseFloat(formData.get('totalAmount')),
        taxableAmount: parseFloat(formData.get('taxableAmount')) || 0,
        vat: parseFloat(formData.get('vat')) || 0
    };

    addExpense(currentProfessorId, 'activity', expense);

    // Reset form
    form.reset();

    // Reload
    loadActivityHistory();
    updateBudgetSummary();

    alert('연구활동비가 저장되었습니다.');
}

function loadActivityHistory() {
    const professor = getProfessorData(currentProfessorId);
    const expenses = professor.expenses.activity;
    const container = document.getElementById('activity-history');

    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-state">등록된 연구활동비 내역이 없습니다.</div>';
        return;
    }

    container.innerHTML = expenses.map(expense => `
        <div class="history-item">
            <div class="history-header">
                <span class="history-date">${expense.category} - ${expense.description}</span>
                <span class="history-amount">${formatCurrency(expense.totalAmount)}</span>
            </div>
            <div class="history-details">
                <div class="history-detail"><strong>사용카드:</strong> ${expense.card}</div>
                <div class="history-detail"><strong>결제일:</strong> ${expense.paymentDate}</div>
                ${expense.taxableAmount ? `<div class="history-detail"><strong>과세금액:</strong> ${formatCurrency(expense.taxableAmount)}</div>` : ''}
                ${expense.vat ? `<div class="history-detail"><strong>부가세:</strong> ${formatCurrency(expense.vat)}</div>` : ''}
            </div>
            <button class="btn-delete" onclick="deleteActivityExpense('${expense.id}')">삭제</button>
        </div>
    `).join('');
}

function deleteActivityExpense(expenseId) {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
        deleteExpense(currentProfessorId, 'activity', expenseId);
        loadActivityHistory();
        updateBudgetSummary();
    }
}

// Research materials expenses
function calculateTotal() {
    const unitPrice = parseFloat(document.getElementById('unitPrice').value) || 0;
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const total = unitPrice * quantity;
    document.getElementById('totalAmount').value = total;
}

async function saveMaterials(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    // Handle file upload
    const fileInput = document.getElementById('materials-file');
    const files = await handleFileUpload(fileInput);

    const expense = {
        category: formData.get('category'),
        description: formData.get('description'),
        card: formData.get('card'),
        paymentDate: formData.get('paymentDate'),
        usageTime: formData.get('usageTime'),
        unitPrice: parseFloat(formData.get('unitPrice')),
        quantity: parseFloat(formData.get('quantity')),
        totalAmount: parseFloat(formData.get('totalAmount')),
        taxableAmount: parseFloat(formData.get('taxableAmount')) || 0,
        vat: parseFloat(formData.get('vat')) || 0,
        registrationDate: formData.get('registrationDate'),
        files: files
    };

    addExpense(currentProfessorId, 'materials', expense);

    // Reset form
    form.reset();

    // Reload
    loadMaterialsHistory();
    updateBudgetSummary();

    alert('연구재료비가 저장되었습니다.');
}

function loadMaterialsHistory() {
    const professor = getProfessorData(currentProfessorId);
    const expenses = professor.expenses.materials;
    const container = document.getElementById('materials-history');

    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-state">등록된 연구재료비 내역이 없습니다.</div>';
        return;
    }

    container.innerHTML = expenses.map(expense => `
        <div class="history-item">
            <div class="history-header">
                <span class="history-date">${expense.category} - ${expense.description}</span>
                <span class="history-amount">${formatCurrency(expense.totalAmount)}</span>
            </div>
            <div class="history-details">
                <div class="history-detail"><strong>사용카드:</strong> ${expense.card}</div>
                <div class="history-detail"><strong>결제일:</strong> ${expense.paymentDate}</div>
                <div class="history-detail"><strong>단가:</strong> ${formatCurrency(expense.unitPrice)}</div>
                <div class="history-detail"><strong>개수:</strong> ${expense.quantity}</div>
                ${expense.taxableAmount ? `<div class="history-detail"><strong>과세금액:</strong> ${formatCurrency(expense.taxableAmount)}</div>` : ''}
                ${expense.vat ? `<div class="history-detail"><strong>부가세:</strong> ${formatCurrency(expense.vat)}</div>` : ''}
                ${expense.registrationDate ? `<div class="history-detail"><strong>등록날짜:</strong> ${expense.registrationDate}</div>` : ''}
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
            <button class="btn-delete" onclick="deleteMaterialsExpense('${expense.id}')">삭제</button>
        </div>
    `).join('');
}

function deleteMaterialsExpense(expenseId) {
    if (confirm('이 항목을 삭제하시겠습니까?')) {
        deleteExpense(currentProfessorId, 'materials', expenseId);
        loadMaterialsHistory();
        updateBudgetSummary();
    }
}
