// Main page logic
// Don't load data immediately - wait for Google authentication
// loadProfessorCards() will be called from google-api.js after login

async function loadProfessorCards() {
    try {
        const data = await getData();

        if (!data || !data.professors) {
            console.log('No data available yet');
            return;
        }

        // Update Choi professor card
        await updateCard('choi', data.professors.choi);

        // Update Lim professor card
        await updateCard('lim', data.professors.lim);
    } catch (error) {
        console.error('Error loading professor cards:', error);
    }
}

async function updateCard(professorId, professorData) {
    try {
        const totals = await calculateTotals(professorId);

        document.getElementById(`${professorId}-total`).textContent = formatCurrency(totals.totalBudget);
        document.getElementById(`${professorId}-spent`).textContent = formatCurrency(totals.totalSpent);
        document.getElementById(`${professorId}-remaining`).textContent = formatCurrency(totals.remaining);
        document.getElementById(`${professorId}-activity-remaining`).textContent = formatCurrency(totals.activityRemaining);
        document.getElementById(`${professorId}-materials-remaining`).textContent = formatCurrency(totals.materialsRemaining);
    } catch (error) {
        console.error('Error updating card:', error);
    }
}

function goToProfessor(professorId) {
    window.location.href = `professor.html?id=${professorId}`;
}
