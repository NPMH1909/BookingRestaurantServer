import pickle
import numpy as np

with open("model.pkl", "rb") as f:
    model, pivot, user_encoder, restaurant_encoder = pickle.load(f)

def recommend_restaurants(user_id, top_k=5):
    if user_id not in user_encoder.classes_:
        return []

    user_idx = user_encoder.transform([user_id])[0]
    user_vector = pivot.iloc[user_idx].values.reshape(1, -1)

    distances, indices = model.kneighbors(user_vector, n_neighbors=top_k + 1)
    similar_users = indices[0][1:]  # Bỏ chính user

    recommended = set()
    for similar_user in similar_users:
        user_row = pivot.iloc[similar_user]
        top_restaurants = np.argsort(user_row.values)[::-1]
        for r_idx in top_restaurants:
            if user_row.values[r_idx] > 0:
                restaurant_id = restaurant_encoder.inverse_transform([r_idx])[0]
                recommended.add(restaurant_id)
            if len(recommended) >= top_k:
                break
        if len(recommended) >= top_k:
            break
    return list(recommended)
