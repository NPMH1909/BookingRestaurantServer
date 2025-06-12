sentiment_map = {
    "positive": 2,
    "neutral": 1,
    "negative": 0
}

def preprocess_dataset(dataset, tokenizer):
    def tokenize(example):
        tokenized = tokenizer(example["content"], truncation=True, padding="max_length", max_length=128)
        tokenized["label"] = sentiment_map[example["sentiment"]]
        return tokenized
    return dataset.map(tokenize, batched=False)
