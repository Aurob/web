const fonts = ['Yu Gothic', 'YuGothic', 'Meiryo', 'メイリオ', 'Hiragino Kaku Gothic Pro', 'ヒラギノ角ゴ Pro W3', 'Osaka', 'MS PGothic', 'arial', 'helvetica', 'sans-serif'];
pnf_translations = {
    "English": "Page Not Found",
    "Arabic": "صفحة غير موجودة",
    "German": "Seite nicht gefunden",
    "Spanish": "Página no encontrada",
    "French": "Page non trouvée",
    "Hebrew": "עמוד לא נמצא",
    "Italian": "Pagina non trovata",
    "Japanese": "ページが見つかりません",
    "Dutch": "Pagina niet gevonden",
    "Polish": "Strona nie znaleziona",
    "Portuguese": "Página não encontrada",
    "Romanian": "Pagina nu a fost găsită",
    "Russian": "Страница не найдена",
    "Swedish": "Sidan hittades inte",
    "Turkish": "Sayfa Bulunamadı",
    "Ukrainian": "Сторінку не знайдено",
    "Chinese": "页面未找到"
} 
var pause = false;
function create_language_switcher() {
    let l_step = 0;
    setInterval(function(){

        if(pause) return;
        let translation = Object.keys(pnf_translations)[l_step];
        document.getElementById('pnf').innerHTML = pnf_translations[translation];
        // set element title
        let title_text = `Page Not Found (${translation})`;
        document.getElementById('pnf').setAttribute('title', title_text);

        l_step++;
        if (l_step >= Object.keys(pnf_translations).length) l_step = 0;
    }, 100);    

    console.log('Language switcher created');
}

const pathsHeaderDiv = document.createElement('div');
pathsHeaderDiv.id = 'paths_header';
pathsHeaderDiv.style.cssText = 'scrollbar-width: thin; display: flex; overflow-x: auto; width: 100% !important; justify-content: space-between;';
document.body.insertBefore(pathsHeaderDiv, document.body.firstChild);

create_language_switcher();


window.addEventListener('load', function() {   
    document.getElementById('pnf').onmouseover = function() {
        pause = true;
    }
    document.getElementById('pnf').onmouseout = function() {
        pause = false;
    }
});