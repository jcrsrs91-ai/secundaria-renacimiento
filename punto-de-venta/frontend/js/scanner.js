let html5QrcodeScanner = null;
let currentTarget = null; // 'search' or 'product'

const scanner = {
    start: (elementId, target) => {
        currentTarget = target;
        const scanArea = document.getElementById(elementId);
        scanArea.classList.remove('hidden');
        scanArea.classList.add('flex', 'flex-col', 'items-center', 'justify-center');
        
        if (!html5QrcodeScanner) {
            html5QrcodeScanner = new Html5Qrcode(elementId);
        }

        const config = { fps: 10, qrbox: { width: 250, height: 150 } };
        
        html5QrcodeScanner.start({ facingMode: "environment" }, config, scanner.onScanSuccess)
        .catch(err => {
            console.warn("Cámara local bloqueada (posiblemente por red sin HTTPS). Usando fallback de foto.", err);
            // Hide the UI immediately since start failed
            document.getElementById('scanArea').classList.add('hidden');
            document.getElementById('scanAreaModal').classList.add('hidden');
            document.getElementById('fallbackBarcodeFile').click();
        });
    },

    handleFallback: (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!html5QrcodeScanner) {
            html5QrcodeScanner = new Html5Qrcode('scanAreaModal'); // dummy element fallback
        }

        html5QrcodeScanner.scanFile(file, true)
            .then(decodedText => {
                scanner.onScanSuccess(decodedText);
            })
            .catch(err => {
                // If local JS fails, try AI fallback!
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = async () => {
                    const base64 = reader.result;
                    try {
                        const response = await fetch(`${API_URL}/ai/read-barcode`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ imageBase64: base64 })
                        });
                        const data = await response.json();
                        if (response.ok && data.barcode) {
                            scanner.onScanSuccess(data.barcode);
                        } else {
                            alert("La IA tampoco pudo detectar el código de barras en la foto. Intenta tomar la foto más cerca o con mejor iluminación.");
                        }
                    } catch (aiErr) {
                        alert("No se pudo detectar el código de barras y falló la conexión con la IA.");
                    }
                };
            });
        
        event.target.value = ''; // Reset input
    },

    stop: () => {
        if (html5QrcodeScanner) {
            try {
                html5QrcodeScanner.stop().then(() => {
                    document.getElementById('scanArea').classList.add('hidden');
                    document.getElementById('scanAreaModal').classList.add('hidden');
                }).catch(err => console.log('Scanner no estaba escaneando.'));
            } catch (e) {
                console.log('Error deteniendo scanner', e);
            }
        }
    },

    onScanSuccess: (decodedText, decodedResult) => {
        scanner.stop();
        
        if (currentTarget === 'search') {
            document.getElementById('searchInput').value = decodedText;
            app.handleBarcodeScan(decodedText);
        } else if (currentTarget === 'product') {
            document.getElementById('p_barcode').value = decodedText;
        }
    }
};
