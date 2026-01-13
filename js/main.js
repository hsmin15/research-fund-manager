// Main page logic
document.addEventListener('DOMContentLoaded', () => {
    loadProfessorCards();
});

function loadProfessorCards() {
    const data = getData();

    // Update Choi professor card
    updateCard('choi', data.professors.choi);

    // Update Lim professor card
    updateCard('lim', data.professors.lim);
}

function updateCard(professorId, professorData) {
    const totals = calculateTotals(professorId);

    document.getElementById(`${professorId}-total`).textContent = formatCurrency(totals.totalBudget);
    document.getElementById(`${professorId}-spent`).textContent = formatCurrency(totals.totalSpent);
    document.getElementById(`${professorId}-remaining`).textContent = formatCurrency(totals.remaining);
    document.getElementById(`${professorId}-activity-remaining`).textContent = formatCurrency(totals.activityRemaining);
    document.getElementById(`${professorId}-materials-remaining`).textContent = formatCurrency(totals.materialsRemaining);
}

function goToProfessor(professorId) {
    window.location.href = `professor.html?id=${professorId}`;
}
