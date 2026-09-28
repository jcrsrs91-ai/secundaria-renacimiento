export const isBeforeSept30 = () => {
    const today = new Date();
    const month = today.getMonth(); // 0 = Jan, 7 = Aug, 8 = Sept
    const date = today.getDate();
    
    // El inicio de ciclo normalmente es en agosto.
    // Si estamos en agosto (7) o septiembre (8) antes del 30, es antes del corte.
    if (month === 7) return true;
    if (month === 8 && date < 30) return true;
    
    return false;
};
