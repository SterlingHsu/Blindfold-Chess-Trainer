from flask import Flask, render_template, request
from stockfish import Stockfish
import time

stockfish = Stockfish(path="./engine/stockfish")

app = Flask(__name__)

@app.route('/')
def root():
    return render_template('index.html')

@app.route('/make_move', methods=['POST'])
def make_move():
    fen = request.form.get('fen')
    difficulty = int(request.form.get('difficulty'))

    stockfish.update_engine_parameters({"Skill Level": difficulty})

    stockfish.set_fen_position(fen)

    best_move = stockfish.get_best_move_time(50)
    time.sleep(1)

    score = stockfish.get_evaluation()['value']

    stockfish.make_moves_from_current_position([best_move])

    fen = stockfish.get_fen_position()

    return {
        'fen': fen,
        'best_move': str(best_move),
        'score': str(score),
    }

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
