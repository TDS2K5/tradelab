from app import app
with app.test_client() as client:
    with client.session_transaction() as sess:
        sess['user_id'] = 1
    response = client.get('/api/history/ADANIPORTS.NS?period=1y')
    print(response.status_code)
    print(response.json.keys() if response.json else response.data)
