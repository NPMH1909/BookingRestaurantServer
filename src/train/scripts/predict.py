import sys
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tokenizer = AutoTokenizer.from_pretrained("vinai/phobert-base")
model = AutoModelForSequenceClassification.from_pretrained("src/train/models/sentiment_phobert")

label_map = {
    0: "negative",
    1: "neutral",
    2: "positive"
}

def predict_sentiment(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        pred = torch.argmax(outputs.logits).item()
        return label_map[pred]

if __name__ == "__main__":
    text = sys.argv[1]
    print(predict_sentiment(text))
