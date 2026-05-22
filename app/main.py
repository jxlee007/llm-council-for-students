from backend.main import app

if __name__ == "__main__":
    import os
    import uvicorn
    
    port = int(os.environ.get("PORT", 8001))
    reload = os.environ.get("APP_ENV", "development") != "production"
    
    # 💡 Industry standard: Render sets your Root Directory to 'app', 
    # so main.py is in the root directory context. Use "main:app" directly.
    app_target = "main:app"
    
    uvicorn.run(app_target, host="0.0.0.0", port=port, reload=reload)
