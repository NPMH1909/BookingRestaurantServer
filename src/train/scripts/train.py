from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from datasets import load_dataset
from preprocess import preprocess_dataset

model_name = "vinai/phobert-base"
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Load & preprocess data
dataset = load_dataset("json", data_files="data/reviews.json")
encoded = preprocess_dataset(dataset["train"], tokenizer)

# ✅ Sửa số nhãn thành 3 (negative, neutral, positive)
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=3)

training_args = TrainingArguments(
    output_dir="./models/sentiment_phobert",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    save_total_limit=1,
    logging_dir="./logs",
    logging_steps=10
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=encoded,
)

trainer.train()
trainer.save_model("./models/sentiment_phobert")
