(function(){
  const refs=['va3183','vm2421','vm2387','va3052','va3050','vm2296','vaipeo','vm1786','vt1561','vt1510','vt1320','va2903','vm2351'];
  document.querySelectorAll('.property-card-premium').forEach((card,index)=>{
    const ref=refs[index];if(!ref)return;const href='/fiche-bien.html?ref='+ref;
    const image=card.querySelector('.catalogue-card-image');if(image){image.href=href;image.removeAttribute('target');image.removeAttribute('rel')}
    const action=card.querySelector('.property-card-actions a');if(action){action.href=href;action.removeAttribute('target');action.removeAttribute('rel');action.textContent='Découvrir le bien'}
    const title=card.querySelector('h3');if(title&&!title.querySelector('a')){const link=document.createElement('a');link.href=href;link.textContent=title.textContent;title.textContent='';title.appendChild(link)}
  });
})();
