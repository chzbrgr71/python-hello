#!env python
from flask import Flask
import os

port = 8080
if 'PORT' in os.environ: 
    port = int(os.getenv("PORT"))

Flask.get = lambda self, path: self.route(path, methods=['get'])

app = Flask(__name__)

@app.get('/')
def get_root(): 
    return "Hello from Brian Redmond v1.0"

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=port)
