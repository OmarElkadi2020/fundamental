document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');

    const state = {
        currentStep: null,
        analysisSteps: [
            { id: 'idea_generation', name: 'Idea Generation', completed: false, data: null, use_cache: true },
            { id: 'filtering', name: 'Filtering', completed: false, data: null, use_cache: true },
            { id: 'categorization', name: 'Categorization', completed: false, data: null, use_cache: true },
            { id: 'vetting', name: 'Vetting', completed: false, data: null, use_cache: true },
        ],
        selectedStock: null,
    };

    function render() {
        app.innerHTML = `
            <h1>Stock Screener</h1>
            <button id="start-analysis">Start Analysis</button>
            <div id="progress-bar"></div>
            <div id="results"></div>
            <div id="stock-details" class="hidden"></div>
        `;

        renderProgressBar();
        renderResults();

        document.getElementById('start-analysis').addEventListener('click', startAnalysis);
    }

    function renderProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        progressBar.innerHTML = state.analysisSteps.map(step => `
            <div class="step ${step.completed ? 'completed' : ''} ${state.currentStep === step.id ? 'active' : ''}" id="step-${step.id}">
                <h2>${step.name}</h2>
                <div class="cache-toggle">
                    <label for="cache-${step.id}">Use Cached Data</label>
                    <input type="checkbox" id="cache-${step.id}" ${step.use_cache ? 'checked' : ''}>
                </div>
            </div>
        `).join('');

        state.analysisSteps.forEach(step => {
            document.getElementById(`cache-${step.id}`).addEventListener('change', (e) => {
                step.use_cache = e.target.checked;
            });
        });
    }

    function renderResults() {
        const resultsContainer = document.getElementById('results');
        const vettingStep = state.analysisSteps.find(step => step.id === 'vetting');

        if (vettingStep && vettingStep.completed && vettingStep.data) {
            resultsContainer.innerHTML = vettingStep.data.map(stock => `
                <div class="stock-card" data-symbol="${stock.symbol}">
                    <h3>${stock.name} (${stock.symbol})</h3>
                    <p>Score: ${stock.score}</p>
                </div>
            `).join('');

            document.querySelectorAll('.stock-card').forEach(card => {
                card.addEventListener('click', () => {
                    const symbol = card.dataset.symbol;
                    state.selectedStock = vettingStep.data.find(s => s.symbol === symbol);
                    renderStockDetails();
                });
            });
        }
    }

    function renderStockDetails() {
        const detailsContainer = document.getElementById('stock-details');
        if (state.selectedStock) {
            const stock = state.selectedStock;
            detailsContainer.innerHTML = `
                <div class="modal-content">
                    <button id="close-details">&times;</button>
                    <h2>${stock.name} (${stock.symbol})</h2>
                    <pre>${JSON.stringify(stock, null, 2)}</pre>
                </div>
            `;
            detailsContainer.classList.remove('hidden');

            document.getElementById('close-details').addEventListener('click', () => {
                detailsContainer.classList.add('hidden');
                state.selectedStock = null;
            });
        } else {
            detailsContainer.classList.add('hidden');
        }
    }

    async function startAnalysis() {
        for (const step of state.analysisSteps) {
            state.currentStep = step.id;
            renderProgressBar();
            try {
                const response = await fetch('/api/run_analysis_step', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        step: step.id, 
                        use_cache: step.use_cache,
                        payload: step.id === 'filtering' ? { ideas: state.analysisSteps[0].data } : {}
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                step.data = result.data;
                step.completed = true;
                renderProgressBar();
                renderResults(); // Re-render results after each step

            } catch (error) {
                console.error(`Error during ${step.name}:`, error);
                break; // Stop on error
            }
        }
        state.currentStep = null;
        renderProgressBar();
    }

    render();
});