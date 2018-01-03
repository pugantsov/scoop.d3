from __future__ import print_function
from flask import render_template
from flask import json
from scoop_analytics import app
from scoop_analytics.models import db, BaseModel, Documents, SharePrices
from sqlalchemy import *
import time
import sys

@app.route("/")
def main():
	prices_result = db.engine.execute("SELECT symbol, timestamp, open, close, high, low, volume FROM share_prices WHERE (close >= 1.025 * open) AND volume <> 0 AND symbol LIKE 'HMNY';")
	docs_result = db.engine.execute("SELECT DISTINCT data->'id' as tweet_id, data->'text' as tweet_text, data->'created_at' as tweet_created, value as cashtag FROM documents, jsonb_array_elements(data->'entities'->'symbols') where value->>'text' in ('HMNY');")
	
	docs = json.dumps([dict(r) for r in docs_result])
	prices = json.dumps([dict(r) for r in prices_result])

	return render_template('index.html', documents=docs, share_prices=prices)