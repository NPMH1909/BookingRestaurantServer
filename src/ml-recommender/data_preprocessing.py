import pandas as pd
from pymongo import MongoClient

def load_data():
    client = MongoClient("mongodb+srv://Booking:Npmh1410@cluster0.dh7r85v.mongodb.net/")
    db = client["test"]

    orders = pd.DataFrame(list(db.orders.find()))
    reviews = pd.DataFrame(list(db.reviews.find()))
    views = pd.DataFrame(list(db.viewlogs.find()))
    searches = pd.DataFrame(list(db.searchlogs.find()))
    restaurants = pd.DataFrame(list(db.restaurants.find()))


    return orders, reviews, views, searches, restaurants

def build_user_item_matrix(orders, reviews, views):
    # Gộp điểm đánh giá từ review, đơn đặt hàng và lượt xem
    interactions = []

    if not reviews.empty:
        reviews["score"] = reviews["rating"].fillna(0)
        interactions.append(reviews[["userId", "restaurantId", "score"]])

    if not orders.empty:
        orders["score"] = orders["rating"].fillna(3)
        interactions.append(orders[["userId", "restaurantId", "score"]])

    if not views.empty:
        views["score"] = 2  # Giả định mỗi lượt xem mang 2 điểm
        interactions.append(views[["userId", "restaurantId", "score"]])

    df = pd.concat(interactions)
    df = df.groupby(["userId", "restaurantId"]).mean().reset_index()
    return df
