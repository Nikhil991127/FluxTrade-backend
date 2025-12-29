#!/usr/bin/env python3
# server/ml/predict_stock.py
import sys
import json
import traceback
from datetime import datetime, timedelta

def main():
    try:
        # optional CLI arg: days to predict
        args = sys.argv[1:]
        days = int(args[0]) if args else 1

        raw = sys.stdin.read()
        payload = json.loads(raw)

        hist = payload.get("historical") or payload.get("data") or []
        if not isinstance(hist, list) or len(hist) < 8:
            raise ValueError("Expected 'historical' list with at least 8 items.")

        # Normalize rows: expect {'date': 'YYYY-MM-DD', 'close': float}
        rows = []
        for r in hist:
            # support AlphaVantage style keys
            date = r.get("date") or r.get("Date") or r.get("timestamp")
            close = r.get("close") or r.get("Close") or r.get("adj_close") or r.get("adjusted_close")
            if date is None or close is None:
                continue
            rows.append({"date": str(date), "close": float(close)})

        # Sort ascending by date
        rows.sort(key=lambda x: datetime.fromisoformat(x["date"]))

        # Convert to DataFrame
        try:
            import pandas as pd
        except Exception as e:
            raise RuntimeError("pandas is required. Install with: pip install pandas") from e

        df = pd.DataFrame(rows)
        df['date'] = pd.to_datetime(df['date'])
        df = df[['date', 'close']]

        # Try Prophet first
        used_model = None
        predictions = []

        try:
            # Prophet import can be 'prophet' or 'fbprophet' depending on install
            try:
                from prophet import Prophet
            except Exception:
                from fbprophet import Prophet

            prop_df = df.rename(columns={'date': 'ds', 'close': 'y'})
            m = Prophet(daily_seasonality=True)
            m.fit(prop_df)
            future = m.make_future_dataframe(periods=days)
            forecast = m.predict(future)
            preds = forecast[['ds', 'yhat']].tail(days)
            for idx, row in preds.iterrows():
                predictions.append({"date": row['ds'].strftime("%Y-%m-%d"), "predicted": float(row['yhat'])})
            used_model = "prophet"
        except Exception as ex_prophet:
            # Fallback: simple linear regression on day index
            try:
                from sklearn.linear_model import LinearRegression
                import numpy as np

                df = df.reset_index(drop=True)
                df['day_index'] = (df['date'] - df['date'].min()).dt.days
                X = df[['day_index']].values
                y = df['close'].values

                model = LinearRegression()
                model.fit(X, y)

                last_idx = int(df['day_index'].iloc[-1])
                for i in range(1, days + 1):
                    next_idx = last_idx + i
                    pred = model.predict([[next_idx]])[0]
                    next_date = (df['date'].iloc[-1] + timedelta(days=i)).strftime("%Y-%m-%d")
                    predictions.append({"date": next_date, "predicted": float(pred)})
                used_model = "linear_regression"
            except Exception as ex_lr:
                # If everything fails, raise an error
                traceback.print_exc()
                raise RuntimeError("No ML backend available. Install prophet or scikit-learn.") from ex_lr

        # Output JSON
        out = {"model": used_model, "predictions": predictions, "last_known": {"date": df['date'].iloc[-1].strftime("%Y-%m-%d"), "close": float(df['close'].iloc[-1])}}
        sys.stdout.write(json.dumps(out))
        sys.stdout.flush()
    except Exception as e:
        err = {"error": str(e), "trace": traceback.format_exc()}
        sys.stdout.write(json.dumps(err))
        sys.stdout.flush()
        sys.exit(1)

if __name__ == "__main__":
    main()
