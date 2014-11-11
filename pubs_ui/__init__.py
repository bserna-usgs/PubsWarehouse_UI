from flask import Flask
from flask.ext.images import Images
#from jinja2 import Environment
from pubs_ui.custom_filters import get_publication_type, display_publication_info


app = Flask(__name__)
images = Images(app)
app.config.from_object('settings')
app.jinja_env.filters['get_publication_type'] = get_publication_type
app.jinja_env.filters['display_pub_info'] = display_publication_info


import PubsFlask