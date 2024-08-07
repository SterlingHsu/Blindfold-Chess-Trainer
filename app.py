from flask import Flask, render_template, request, jsonify
import requests
import os

app = Flask(__name__)

STOCKFISH_API_URL = os.environ.get('STOCKFISH_API_URL', 'http://localhost:5000/make-move')

@app.route('/')
def root():
    return render_template('index.html')

@app.route('/make_move', methods=['POST'])
def make_move():
    fen = request.form.get('fen')
    difficulty = int(request.form.get('difficulty'))

    response = requests.post(STOCKFISH_API_URL, json={
        'fen': fen,
        'difficulty': difficulty
    })

    if response.status_code == 200:
        data = response.json()
        return jsonify(data)
    else:
        return jsonify({'error': 'Failed to get move from Stockfish API'}), 500

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
