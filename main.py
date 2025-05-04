from flask import Flask, request
import requests

app = Flask(__name__)

CAPITAL_API_KEY = 'TU_API_KEY'
CAPITAL_ACCOUNT_ID = 'TU_ACCOUNT_ID'
CAPITAL_API_URL = 'https://api-capital.backend-capital.com'

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.get_json()
    signal = data.get('message')

    if signal == 'buy':
        ejecutar_orden('BUY')
    elif signal == 'sell':
        ejecutar_orden('SELL')
    elif signal == 'buy_fibonacci':
        ejecutar_orden('BUY')

    return 'ok'

def ejecutar_orden(direccion):
    headers = {
        'X-CAP-API-KEY': CAPITAL_API_KEY,
        'Content-Type': 'application/json'
    }
    orden = {
        "marketId": "DEMO_MARKET_ID",
        "direction": direccion,
        "size": 1,
        "orderType": "MARKET",
        "currencyCode": "USD"
    }

    response = requests.post(
        f"{CAPITAL_API_URL}/api/v1/positions",
        json=orden,
        headers=headers
    )
    print(response.json())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
