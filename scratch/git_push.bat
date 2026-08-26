git reset HEAD~1
echo scratch/ >> .gitignore
echo punto-de-venta/backend/.env >> .gitignore
git add src/ .gitignore
git commit -m "Implement Extraordinarios and Constancia Terminacion Tramite"
git push origin main
