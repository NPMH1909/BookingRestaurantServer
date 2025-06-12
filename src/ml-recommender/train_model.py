import pickle
from sklearn.neighbors import NearestNeighbors
from data_preprocessing import load_data, build_user_item_matrix
from sklearn.preprocessing import LabelEncoder
import pandas as pd

orders, reviews, views, searches, restaurants = load_data()
df = build_user_item_matrix(orders, reviews, views)

user_encoder = LabelEncoder()
restaurant_encoder = LabelEncoder()

df["user"] = user_encoder.fit_transform(df["userId"].astype(str))
df["restaurant"] = restaurant_encoder.fit_transform(df["restaurantId"].astype(str))

pivot = df.pivot(index="user", columns="restaurant", values="score").fillna(0)

model = NearestNeighbors(metric='cosine', algorithm='brute')
model.fit(pivot)

with open("model.pkl", "wb") as f:
    pickle.dump((model, pivot, user_encoder, restaurant_encoder), f)
