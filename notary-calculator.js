(function(){
  "use strict";
  var form=document.querySelector("[data-notary-calculator]");
  if(!form)return;

  var money=new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0});
  var format=function(value){return money.format(Math.max(0,Math.round(value)))+" F CFP"};
  var number=function(name){return Math.max(0,Number(form.elements[name].value)||0)};

  function progressiveRights(base,status){
    if(status==="standard")return Math.max(7000,base*.07);
    var threshold=status==="firstLand"?25000000:40000000;
    return Math.min(base,threshold)*.01+Math.max(0,base-threshold)*.07;
  }

  function notaryActEstimate(base){
    var saleFees=Math.min(1200000,Math.max(185000,240000+base*.0122));
    var formalities=80775;
    var disbursements=380750;
    var vat=(saleFees+formalities)*.13;
    return saleFees+formalities+disbursements+vat;
  }

  function calculate(event){
    if(event)event.preventDefault();
    var price=number("price");
    var agency=Math.min(price,number("agencyFees"));
    var furniture=Math.min(price-agency,number("furniture"));
    var base=Math.max(0,price-agency-furniture);
    var type=form.elements.propertyType.value;
    var status=form.elements.buyerStatus.value;
    var registration=0;
    var typeTax=0;
    var note="Régime ordinaire estimé à 7 % sur la base immobilière hors honoraires ventilés et mobilier.";

    if(type==="vefa"){
      typeTax=price*.09;
      note="VEFA soumise à TVA : estimation à 9 % du prix, sans droits d’enregistrement dans ce calcul.";
    }else if(type==="new"){
      registration=Math.min(base,25000000)*.0175+Math.max(0,base-25000000)*.0225;
      note="Habitation neuve : estimation à 1,75 % jusqu’à 25 M F CFP, puis 2,25 % au-delà.";
    }else{
      registration=progressiveRights(base,status);
      if(status!=="standard")note="Primo-accédant : estimation à 1 % jusqu’au plafond applicable, puis 7 % au-delà. L’éligibilité doit être confirmée.";
    }

    var furnitureRights=furniture*.05;
    var taxes=registration+typeTax+furnitureRights;
    var act=notaryActEstimate(base);
    var total=taxes+act;
    var percent=price?total/price*100:0;

    form.querySelector("[data-notary-base]").textContent=format(base);
    form.querySelector("[data-notary-taxes]").textContent=format(taxes);
    form.querySelector("[data-notary-act]").textContent=format(act);
    form.querySelector("[data-notary-total]").textContent=format(total);
    form.querySelector("[data-notary-percent]").textContent=percent.toLocaleString("fr-FR",{minimumFractionDigits:1,maximumFractionDigits:1})+" %";
    form.querySelector("[data-notary-budget]").textContent=format(price+total);
    form.querySelector("[data-notary-note]").textContent=note+" Estimation hors frais de garantie ou d’hypothèque liés au prêt.";
    if(event&&typeof window.trackEvent==="function")window.trackEvent("notary_calculator_completed",{tool:"notary_fees"});
  }

  form.addEventListener("submit",calculate);
  form.addEventListener("change",calculate);
  calculate();
})();
