(function(){
  "use strict";
  var form=document.querySelector("[data-fees-calculator]");
  if(!form)return;
  var priceInput=form.elements.price,locationInput=form.elements.location,range=form.querySelector("#fees-range");
  var format=new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0});
  var money=function(value){return format.format(Math.round(value))+" F CFP"};
  var parsePrice=function(value){return Number(String(value).replace(/\D/g,""))||0};
  var displayPrice=function(value){return format.format(Math.round(value)).replace(/\u202f/g," ")};
  var vatRate=.13;

  /* A number input cannot display grouping spaces, so keep the numeric mobile
     keyboard while presenting a human-readable CFP amount. */
  priceInput.type="text";
  priceInput.inputMode="numeric";
  priceInput.autocomplete="off";
  priceInput.pattern="[0-9 ]*";
  priceInput.value=displayPrice(parsePrice(priceInput.value));

  function bracket(price){
    if(price<=10000000)return {ht:700000,rate:"Forfait de 700 000 F CFP HT",label:"Jusqu’à 10 M F CFP"};
    if(price<=20000000)return {ht:price*.08,rate:"8 % HT",label:"Plus de 10 à 20 M F CFP"};
    if(price<=30000000)return {ht:price*.07,rate:"7 % HT",label:"Plus de 20 à 30 M F CFP"};
    if(price<=50000000)return {ht:price*.06,rate:"6 % HT",label:"Plus de 30 à 50 M F CFP"};
    if(price<=200000000)return {ht:price*.05,rate:"5 % HT",label:"Plus de 50 à 200 M F CFP"};
    return {ht:price*.04,rate:"4 % HT",label:"Au-delà de 200 M F CFP"};
  }

  function render(){
    var result=form.querySelector(".fees-result"),price=Math.max(0,parsePrice(priceInput.value)),outside=locationInput.value==="other";
    if(outside){
      result.classList.add("is-special");
      form.querySelector("[data-fees-bracket]").textContent="Tarification spéciale";
      form.querySelector("[data-fees-total]").textContent="Sur confirmation";
      form.querySelector("[data-fees-rate]").textContent="Bien hors Tahiti et Moorea";
      form.querySelector("[data-fees-ht]").textContent="—";
      form.querySelector("[data-fees-vat]").textContent="—";
      form.querySelector("[data-fees-message]").textContent="Le barème public annonce une tarification spéciale : aucun montant n’est supposé automatiquement.";
      return;
    }
    result.classList.remove("is-special");
    var band=bracket(price),vat=band.ht*vatRate,total=band.ht+vat;
    form.querySelector("[data-fees-bracket]").textContent=band.label;
    form.querySelector("[data-fees-total]").textContent=money(total);
    form.querySelector("[data-fees-rate]").textContent=band.rate;
    form.querySelector("[data-fees-ht]").textContent=money(band.ht);
    form.querySelector("[data-fees-vat]").textContent=money(vat);
    form.querySelector("[data-fees-message]").textContent="Simulation au taux de TVA indicatif de 13 %, à confirmer dans le mandat.";
  }

  range.addEventListener("input",function(){priceInput.value=displayPrice(Number(range.value));render()});
  priceInput.addEventListener("input",function(){var value=parsePrice(priceInput.value);priceInput.value=value?displayPrice(value):"";if(value<=Number(range.max))range.value=String(Math.max(Number(range.min),value));render()});
  locationInput.addEventListener("change",render);
  form.addEventListener("submit",function(event){event.preventDefault();render()});
  render();
})();
