(() => {
 'use strict';
 const $ = (selector, root = document) => root.querySelector(selector);
 const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
 const assets = window.MOCHI_ASSETS || {};
 const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
 const icon = name => `<svg aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
 const image = (name, alt = '', extra = '') => { const item = assets[name] || {width:1254,height:1254}; return `<img class="od-media" src="assets/images/${name}.webp" width="${item.width}" height="${item.height}" alt="${alt}" ${extra}>`; };
 const flavors = [
  {id:'strawberry',name:'Клубничная любовь',filling:'Клубника со сливками',emotion:'Для тех, кто по уши влюблён.',mood:'Влюблённое настроение',price:240,color:'var(--pink)'},
  {id:'mango',name:'Манговое танго',filling:'Спелое манго',emotion:'Когда внутри маленькое солнце.',mood:'Солнечное настроение',price:240,color:'var(--yellow)'},
  {id:'pistachio',name:'Фисташковый покой',filling:'Фисташковый крем',emotion:'Выдохни. Всё уже хорошо.',mood:'Спокойное настроение',price:280,color:'var(--green)'},
  {id:'blueberry',name:'Черничная мечта',filling:'Черника и ваниль',emotion:'Для мечтаний без границ.',mood:'Мечтательное настроение',price:260,color:'var(--lavender)'},
  {id:'chocolate',name:'Шоколадный взрыв',filling:'Насыщенный шоколад',emotion:'Громкое «да» маленьким радостям.',mood:'Дерзкое настроение',price:260,color:'color-mix(in srgb,var(--pink) 28%,var(--bg))'},
  {id:'coconut',name:'Кокосовое облако',filling:'Кокос и белый шоколад',emotion:'Нежность на максималках.',mood:'Нежное настроение',price:240,color:'color-mix(in srgb,var(--yellow) 35%,var(--bg))'}
 ];
 const emptyCounts = () => Object.fromEntries(flavors.map(flavor => [flavor.id,0]));
 const state = {size:6,counts:emptyCounts(),motionPaused:false};
 try { const saved = JSON.parse(localStorage.getItem('mochi-mood-box-v1')); if(saved && [4,6,9].includes(saved.size) && flavors.every(f => Number.isInteger(saved.counts?.[f.id]) && saved.counts[f.id] >= 0 && saved.counts[f.id] <= 9) && Object.values(saved.counts).reduce((a,b)=>a+b,0) <= saved.size) { state.size = saved.size; state.counts = Object.fromEntries(flavors.map(f=>[f.id,saved.counts[f.id]])); } } catch { /* Storage is optional, including file:// browsing. */ }
 const totalCount = () => flavors.reduce((sum,f)=>sum+state.counts[f.id],0);
 const totalPrice = () => flavors.reduce((sum,f)=>sum+state.counts[f.id]*f.price,0);
 const persist = () => {try{localStorage.setItem('mochi-mood-box-v1',JSON.stringify({size:state.size,counts:state.counts}));}catch{}};
 const selectedItems = () => flavors.filter(f=>state.counts[f.id]>0).map(f=>({id:f.id,name:f.name,quantity:state.counts[f.id],unitPriceRub:f.price}));
 let toastTimer;
 function toast(message){const node=$('#toast');node.textContent=message;node.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('visible'),3500);}
 function announce(message){$('#box-live').textContent=message;}

 $('#flavor-grid').innerHTML=flavors.map((f,index)=>`<article class="flavor-card od-tile reveal" style="--card-color:${f.color}"><div class="flavor-top"><span>${f.mood}</span><svg class="star" aria-hidden="true"><use href="#shape-star"></use></svg></div><div class="flavor-media">${image(f.id,`${f.filling}: целый моти и половинка с начинкой`,'loading="lazy" decoding="async"')}</div><div class="od-field"><h3>${f.name}</h3><p class="flavor-filling">${f.filling}</p><p class="flavor-emotion">${f.emotion}</p></div><div class="flavor-bottom"><div class="od-field"><span class="price">${money(f.price)}</span><span class="added-count" data-card-count="${f.id}">за 1 моти</span></div><button class="add-flavor" type="button" data-add="${f.id}" aria-label="Добавить ${f.name} в бокс">${icon('plus')}</button></div></article>`).join('');
 $('#builder-list').innerHTML=flavors.map(f=>`<div class="builder-row od-row"><span class="flavor-dot" style="--flavor-dot:${f.color}" aria-hidden="true"></span><div class="od-field od-fill"><span class="builder-name">${f.name}</span><span class="builder-price">${money(f.price)} / шт.</span></div><div class="quantity od-fixed" role="group" aria-label="Количество ${f.name}"><button class="qty-btn" type="button" data-remove="${f.id}" aria-label="Убрать один ${f.name}">${icon('minus')}</button><output class="qty-value" data-quantity="${f.id}" aria-label="Количество ${f.name}">0</output><button class="qty-btn" type="button" data-add="${f.id}" aria-label="Добавить один ${f.name}">${icon('plus')}</button></div></div>`).join('');

 function render(){
  const count=totalCount(), price=totalPrice(), complete=count===state.size;
  $$('.size-btn[data-size]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.size)===state.size)));
  flavors.forEach(f=>{
   const node=$(`[data-quantity="${f.id}"]`), previous=Number(node.value);
   node.value=state.counts[f.id];node.textContent=state.counts[f.id];
   if(previous!==state.counts[f.id]){node.classList.remove('animate-quantity');requestAnimationFrame(()=>node.classList.add('animate-quantity'));}
   $(`[data-remove="${f.id}"]`).disabled=state.counts[f.id]===0;
   $(`[data-card-count="${f.id}"]`).textContent=state.counts[f.id]>0?`В боксе: ${state.counts[f.id]} шт.`:'за 1 моти';
   $$(`#builder-list [data-add="${f.id}"]`).forEach(button=>{button.disabled=complete;});
  });
  $('#box-count').textContent=`${count} / ${state.size}`;
  $('#box-size-label').textContent=`БОКС НА ${state.size} МОТИ`;
  $('#box-price').textContent=money(price);
  $('#progress-fill').style.transform=`scaleX(${count/state.size})`;
  $('#box-progress').setAttribute('aria-valuemax',String(state.size));$('#box-progress').setAttribute('aria-valuenow',String(count));$('#box-progress').setAttribute('aria-valuetext',`Выбрано ${count} из ${state.size} моти`);
  $('#box-status').textContent=complete?'Идеальный микс! Бокс готов к оформлению.':count===0?'Начни с любимого вкуса — добавляй моти кнопкой +.':`Ещё ${state.size-count} ${plural(state.size-count,'моти','моти','моти')} — и твоё счастье в сборе.`;
  $('#checkout-open').disabled=!complete;$('#checkout-open').setAttribute('aria-describedby','box-status');
  $('#composition-list').innerHTML=count?selectedItems().map(f=>`<li>${f.name} — ${f.quantity} шт.</li>`).join(''):'<li>В боксе пока пусто. Добавь первый вкус.</li>';
  const tray=$('#box-tray');tray.dataset.size=state.size;
  if(tray.children.length!==state.size){tray.replaceChildren(...Array.from({length:state.size},()=>{const slot=document.createElement('div');slot.className='box-slot';return slot;}));}
  const contents=flavors.flatMap(f=>Array.from({length:state.counts[f.id]},()=>f));
  [...tray.children].forEach((slot,i)=>{const f=contents[i],key=f?.id||'empty';if(slot.dataset.flavor===key)return;slot.dataset.flavor=key;slot.innerHTML=f?image(f.id,f.name):'<span class="slot-plus" aria-hidden="true">+</span>';slot.setAttribute('aria-label',f?`${i+1}. ${f.name}`:`Место ${i+1}: пока пусто`);});
  const headerCount=$('#header-box-count');headerCount.textContent=count?` · ${count}`:'';
  persist();
 }
 function plural(n,one,few,many){return n%10===1&&n%100!==11?one:n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?few:many;}
 function add(id){const f=flavors.find(f=>f.id===id);if(!f)return;if(totalCount()>=state.size){toast(`Бокс на ${state.size} моти уже полон. Увеличь размер или убери один вкус.`);announce('Бокс полон. Измени размер или состав.');return;}state.counts[id]++;render();toast(`${f.name} — в твоём боксе!`);announce(`${f.name} добавлен. Выбрано ${totalCount()} из ${state.size}.`);}
 function remove(id){if(!state.counts[id])return;state.counts[id]--;render();announce(`Количество изменено. Выбрано ${totalCount()} из ${state.size}.`);}

 let lastFocused=null,pendingSize=null;
 function openDialog(dialog){lastFocused=document.activeElement;dialog.showModal();document.body.classList.add('modal-open');}
 function closeDialog(dialog){dialog.close();}
 $$('dialog').forEach(dialog=>{
  dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');lastFocused?.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)closeDialog(dialog);});
 });
 function changeSize(size){if(![4,6,9].includes(size)||size===state.size)return;if(totalCount()>size){pendingSize=size;$('#resize-copy').textContent=`Сейчас выбрано ${totalCount()} моти, а в новом боксе только ${size} места. Можно сохранить текущий набор или очистить его и начать бокс на ${size} моти.`;openDialog($('#resize-dialog'));return;}state.size=size;render();announce(`Выбран бокс на ${size} моти.`);}
 function orderSummary(){return `<strong>Твой бокс · ${state.size} шт.</strong><ul>${selectedItems().map(f=>`<li><span>${f.name}</span><span>${f.quantity} × ${money(f.unitPriceRub)}</span></li>`).join('')}</ul><div class="summary-total"><span>Итого</span><span>${money(totalPrice())}</span></div>`;}
 function openCheckout(){if(totalCount()!==state.size){toast('Сначала заполни бокс любимыми вкусами.');return;}$('#order-summary').innerHTML=orderSummary();$('#checkout-form-panel').hidden=false;$('#checkout-success').hidden=true;$('#checkout-title').textContent='ТВОЁ СЧАСТЬЕ ПОЧТИ ДОМА';$('#form-error-summary').hidden=true;openDialog($('#checkout-dialog'));}
 function showInfo(title,copy){$('#info-title').textContent=title;$('#info-copy').textContent=copy;openDialog($('#info-dialog'));}

 document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.add){add(button.dataset.add);return;}
  if(button.dataset.remove){remove(button.dataset.remove);return;}
  if(button.dataset.size){changeSize(Number(button.dataset.size));return;}
  if(button.hasAttribute('data-close')){closeDialog(button.closest('dialog'));return;}
  if(button.dataset.social){showInfo(button.dataset.social,'Это демонстрационный дизайн-концепт Моти Муд. Официальная ссылка пока не подключена — мы не отправляем тебя в чужой аккаунт.');return;}
  if(button.hasAttribute('data-delivery-info'))showInfo('ДОСТАВИМ ТВОЁ НАСТРОЕНИЕ','В концепте предусмотрены доставка по Санкт-Петербургу и самовывоз по предварительной договорённости. Адрес, стоимость и удобное время необходимо согласовать после подключения настоящего оформления. Сейчас заявка никуда не отправляется.');
 });
 $('#resize-confirm').addEventListener('click',()=>{if(pendingSize){state.size=pendingSize;state.counts=emptyCounts();pendingSize=null;render();closeDialog($('#resize-dialog'));toast('Новый бокс готов. Выбирай любимые вкусы!');}});
 $('#checkout-open').addEventListener('click',openCheckout);
 $('#gift-info').addEventListener('click',()=>showInfo('ДЛЯ ЧЬЕГО-ТО СЧАСТЬЯ','В форме можно выбрать подарочное оформление и написать пожелание в комментарии. В демонстрационном режиме это сохранится только в показанном составе заявки. Доплата и реальные условия не заданы.'));

 // The real order service can be connected here without changing the UI.
 // This implementation deliberately performs no request and no payment.
 const orderService={async submit(order){return {mode:'demo',sent:false,order};}};
 const form=$('#order-form');
 const validators={
  customerName:input=>input.value.trim().length>=2?'':'Напиши имя: хотя бы два символа.',
  customerPhone:input=>{const digits=input.value.replace(/\D/g,'');return /^[+\d\s().-]+$/.test(input.value)&&digits.length>=11&&digits.length<=15?'':'Укажи телефон с кодом страны: от 11 до 15 цифр, например +7 999 123-45-67.';},
  receiving:input=>['delivery','pickup'].includes(input.value)?'':'Выбери доставку или самовывоз.'
 };
 function validateField(id){const input=$('#'+id),message=validators[id](input);$('#'+id+'-error').textContent=message;input.setAttribute('aria-invalid',String(!!message));return message;}
 Object.keys(validators).forEach(id=>$('#'+id).addEventListener('blur',()=>validateField(id)));
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const errors=Object.keys(validators).map(id=>({id,message:validateField(id)})).filter(item=>item.message),summary=$('#form-error-summary');
  if(errors.length){summary.innerHTML=`<strong>Проверь, пожалуйста, поля:</strong><ul>${errors.map(error=>`<li><a href="#${error.id}">${error.message}</a></li>`).join('')}</ul>`;summary.hidden=false;summary.focus();return;}
  summary.hidden=true;
  if(totalCount()!==state.size){toast('Состав бокса изменился. Заполни его перед оформлением.');closeDialog($('#checkout-dialog'));return;}
  const submit=$('#order-submit');submit.disabled=true;submit.textContent='Показываем твой заказ…';
  const order={size:state.size,items:selectedItems(),totalRub:totalPrice(),customer:{name:$('#customerName').value.trim(),phone:$('#customerPhone').value.trim()},receiving:$('#receiving').value,comment:$('#comment').value.trim(),gift:$('#gift').checked};
  try{
   const result=await orderService.submit(order);
   if(result.mode!=='demo'||result.sent!==false)throw new Error('Unexpected response');
   $('#checkout-form-panel').hidden=true;$('#checkout-success').hidden=false;$('#checkout-title').textContent='СЧАСТЬЕ В СБОРЕ';$('#success-order').innerHTML=orderSummary();$('#success-receiving').textContent=`${order.receiving==='delivery'?'Доставка по Санкт-Петербургу':'Самовывоз по договорённости'}${order.gift?' · Подарочное оформление':''}`;
   $('#success-heading').focus();
  }catch{summary.textContent='Не удалось показать состав. Данные не отправлены. Попробуй ещё раз.';summary.hidden=false;summary.focus();}
  finally{submit.disabled=false;submit.textContent='ПОСМОТРЕТЬ ДЕМОЗАКАЗ';}
 });
 $('#form-error-summary').addEventListener('click',event=>{const link=event.target.closest('a');if(!link)return;event.preventDefault();$(link.getAttribute('href'))?.focus();});

 // Mobile navigation is part of the same page.
 const menuToggle=$('#menu-toggle'),nav=$('#main-nav');
 function closeMenu(){nav.classList.remove('is-open');menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Открыть меню');}
 menuToggle.addEventListener('click',()=>{const open=menuToggle.getAttribute('aria-expanded')!=='true';menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');nav.classList.toggle('is-open',open);});
 nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('is-open')){closeMenu();menuToggle.focus();}});
 document.addEventListener('click',event=>{if(!event.target.closest('.header'))closeMenu();});
 const menuMedia=matchMedia('(min-width:768px)');menuMedia.addEventListener('change',closeMenu);

 // Native details preserve keyboard behaviour even without JavaScript.
 $$('.faq-item').forEach(item=>item.addEventListener('toggle',()=>{if(item.open)$$('.faq-item').forEach(other=>{if(other!==item)other.open=false;});}));

 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 let observer=null,framePending=false,heroX=0,heroY=0;
 function motionAllowed(){return !reducedMotion.matches&&!state.motionPaused;}
 if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08});$$('.reveal').forEach(node=>{node.classList.add('is-observed');observer.observe(node);});}
 function paintMotion(){framePending=false;const campaign=$('#campaign'),object=$('#campaign-object'),heroImage=$('#hero-image');if(!motionAllowed()){object.style.transform='none';heroImage.style.transform='none';return;}const bounds=campaign.getBoundingClientRect();if(bounds.bottom>0&&bounds.top<innerHeight){const progress=Math.max(0,Math.min(1,(innerHeight-bounds.top)/(innerHeight+bounds.height)));object.style.transform=`scale(${.92+progress*.18}) rotate(${-7+progress*14}deg)`;}heroImage.style.transform=`translate(${heroX}px,${heroY}px)`;}
 function requestMotion(){if(!framePending){framePending=true;requestAnimationFrame(paintMotion);}}
 window.addEventListener('scroll',requestMotion,{passive:true});window.addEventListener('resize',requestMotion,{passive:true});
 $('#hero-art').addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||!motionAllowed())return;const bounds=event.currentTarget.getBoundingClientRect();heroX=((event.clientX-bounds.left)/bounds.width-.5)*16;heroY=((event.clientY-bounds.top)/bounds.height-.5)*16;requestMotion();});
 $('#hero-art').addEventListener('pointerleave',()=>{heroX=0;heroY=0;requestMotion();});
 function syncMotion(){document.body.classList.toggle('motion-paused',state.motionPaused||reducedMotion.matches);const button=$('#motion-toggle');button.setAttribute('aria-pressed',String(state.motionPaused));$('#motion-label').textContent=reducedMotion.matches?'Движение отключено системой':state.motionPaused?'Включить движение':'Остановить движение';button.disabled=reducedMotion.matches;requestMotion();}
 $('#motion-toggle').addEventListener('click',()=>{state.motionPaused=!state.motionPaused;syncMotion();});reducedMotion.addEventListener('change',syncMotion);
 render();syncMotion();
})();
