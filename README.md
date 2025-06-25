Demo Video:
[![Watch the video](https://img.youtube.com/vi/X_e-DJ95A_M/maxresdefault.jpg)](https://youtu.be/HUARlUp8i88)  

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)

👉 Project Repository: https://github.com/Revant-1/Ml-Backend

🫀 Cardiovascular Disease Risk Prediction using Machine Learning:

A machine learning-driven healthcare analytics system aimed at enhancing cardiovascular disease (CVD) risk assessment by leveraging structured clinical, lifestyle, and genetic data. This project was developed as part of a research initiative at Fr. C. Rodrigues Institute of Technology, Vashi.

📘 Abstract:

Cardiovascular diseases (CVDs) are a leading cause of global mortality. This project presents a hybrid machine learning framework for early detection and risk stratification of CVDs. Supervised algorithms including Logistic Regression, Support Vector Machines, Random Forest, and XGBoost were employed. The focus lies in optimizing model performance, handling class imbalance, and ensuring clinical interpretability through explainable AI techniques.

🧠 Features
🔍 CVD Risk Prediction using ML models

⚙️ Advanced feature engineering

⚖️ Handling class imbalance with SMOTE

📊 Performance evaluation with accuracy, precision, recall, F1-score

🔎 Explainable AI with SHAP and LIME

🩺 Integration-ready for EHR and telemedicine systems

🛠️ Tech Stack
Python

Pandas, NumPy, Scikit-learn

XGBoost

Matplotlib, Seaborn

SHAP, LIME (for explainability)

🧪 Machine Learning Models Used:
Model	Purpose:
Logistic Regression	Baseline linear classifier

SVM	High-dimensional margin-based classifier

Random Forest	Ensemble method for robust prediction

XGBoost	Boosted decision tree ensemble

📂 Project Structure
bash
Copy
Edit
├── data/                     # Dataset and processed files
├── models/                   # Trained models and pickles
├── notebooks/                # Jupyter Notebooks for training & analysis
├── src/                      # Main scripts for training/prediction
├── outputs/                  # Plots and reports
└── README.md                 # Project documentation

🚀 How to Run
Clone the repository:

git clone https://github.com/your-username/cvd-risk-predictor.git

cd cvd-risk-predictor

Install dependencies

pip install -r requirements.txt

Run the main notebook or script

jupyter notebook notebooks/CVD_Model_Training.ipynb

📈 Results: 
XGBoost achieved the highest accuracy and generalization

Feature importance analysis revealed blood pressure, cholesterol, and age as top predictors

SHAP and LIME enabled model transparency for clinical use

🔍 Future Scope:
Integration with wearable health monitoring devices

Expansion to prediction of other chronic diseases like diabetes

Real-time predictive dashboards for hospital settings

👥 Authors
Aryan Nair – nairaryan135@gmail.com

Dhyan Patel – dhyanbpatel2005@gmail.com

Steffi Varghese – steffiv875@gmail.com

Revant Shinde – revantshinde@gmail.com

Mentors:
Dr. Smita Dange

Dr. Shashikant Dugad
