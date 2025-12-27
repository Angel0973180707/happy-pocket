(function(){
  "use strict";

  // ====== 基本工具 ======
  function qs(id){ return document.getElementById(id); }
  function pad2(n){ return (n<10?("0"+n):(""+n)); }
  function todayKey(){
    var d=new Date();
    return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());
  }
  function monthKey(){
    var d=new Date();
    return d.getFullYear()+"-"+pad2(d.getMonth()+1);
  }

  // ====== 儲存鍵 ======
  var K = {
    month: "hp_currentMonth",
    budget: "hp_budget",
    coins: "hp_coins",
    sessions: "hp_sessions",
    lastDay: "hp_lastDay",
    streak: "hp_streak",
    history: "hp_history",
    chestOpened: "hp_chestOpened",
    roundCompleted: "hp_roundCompleted"
  };

  // ====== 初始化（月切換重置） ======
  function initMonth(){
    var m = monthKey();
    var saved = localStorage.getItem(K.month);
    if(saved !== m){
      localStorage.setItem(K.month, m);
      // 本月狀態重置（保留總功德幣也可以，但 MVP 先只做本月）
      localStorage.setItem(K.sessions, "0");
      localStorage.setItem(K.coins, "0");
      localStorage.setItem(K.chestOpened, "no");
      localStorage.setItem(K.roundCompleted, "no");
      localStorage.setItem(K.history, "[]");
    }
    // 預設零用錢
    if(localStorage.getItem(K.budget) == null){
      localStorage.setItem(K.budget, "100");
    }
  }

  // ====== 連續天數（以「有練功的日子」計） ======
  function updateStreakOnAction(){
    var today = todayKey();
    var last = localStorage.getItem(K.lastDay) || "";
    var streak = parseInt(localStorage.getItem(K.streak) || "0", 10);

    if(last === today){
      // 同日重複，不加
      return;
    }

    // 判斷是否連續（昨天）
    var d = new Date();
    d.setDate(d.getDate()-1);
    var yKey = d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());

    if(last === yKey){
      streak += 1;
    }else{
      streak = 1;
    }
    localStorage.setItem(K.streak, String(streak));
    localStorage.setItem(K.lastDay, today);
  }

  // ====== 記錄一次練功 ======
  function addSession(action){
    var sessions = parseInt(localStorage.getItem(K.sessions) || "0", 10) + 1;
    var coins = parseInt(localStorage.getItem(K.coins) || "0", 10) + 1;

    localStorage.setItem(K.sessions, String(sessions));
    localStorage.setItem(K.coins, String(coins));

    updateStreakOnAction();

    // history
    var hist;
    try{ hist = JSON.parse(localStorage.getItem(K.history) || "[]"); }
    catch(e){ hist = []; }
    hist.unshift({ t: Date.now(), day: todayKey(), action: action });
    if(hist.length > 200) hist.length = 200;
    localStorage.setItem(K.history, JSON.stringify(hist));

    render();
  }

  // ====== 寶箱（完成一輪） ======
  function openChest(){
    var opened = (localStorage.getItem(K.chestOpened) || "no") === "yes";
    if(opened){
      alert("本月寶箱已開過囉 🙂");
      return;
    }
    // MVP：只確認「本月有練功紀錄」再開
    var sessions = parseInt(localStorage.getItem(K.sessions) || "0", 10);
    if(sessions <= 0){
      alert("你本月還沒練功🙂\n先點一張卡，練一次就能開寶箱。");
      return;
    }

    localStorage.setItem(K.chestOpened, "yes");
    localStorage.setItem(K.roundCompleted, "yes"); // ✅ 完成一輪
    alert("🎁 寶箱開啟！\n你完成了這一輪陪跑。\n（回饋表單已解鎖，自願填寫）");
    render();
    unlockFeedbackIfCompleted();
  }

  // ====== 解鎖回饋 ======
  function unlockFeedbackIfCompleted(){
    var completed = (localStorage.getItem(K.roundCompleted) || "no") === "yes";
    var btn = qs("btnFeedback");
    if(!btn) return;

    if(!completed){
      btn.classList.add("disabled");
      btn.setAttribute("aria-disabled","true");
      btn.href="#";
      btn.textContent="留下陪跑回饋（完成一輪後解鎖）";
      return;
    }

    var url = btn.getAttribute("data-feedback-url") || "";
    btn.classList.remove("disabled");
    btn.removeAttribute("aria-disabled");
    btn.textContent="留下陪跑回饋（自願）";
    btn.href = url;
    btn.target = "_blank";
    btn.rel = "noopener";
  }

  // ====== 顯示 ======
  function actionName(a){
    if(a==="brake") return "剎車卡";
    if(a==="time") return "時間卡";
    if(a==="nowant") return "無欲卡";
    return a;
  }

  function render(){
    var today = qs("todayText");
    var streak = qs("streakText");
    var coins = qs("coinText");
    var budget = qs("budgetText");
    var sessions = qs("sessionsText");
    var monthPill = qs("monthPill");
    var chestText = qs("chestText");

    var s = parseInt(localStorage.getItem(K.sessions) || "0", 10);
    var c = parseInt(localStorage.getItem(K.coins) || "0", 10);
    var b = parseInt(localStorage.getItem(K.budget) || "100", 10);
    var st = parseInt(localStorage.getItem(K.streak) || "0", 10);
    var opened = (localStorage.getItem(K.chestOpened) || "no") === "yes";

    if(today) today.textContent = (localStorage.getItem(K.lastDay) ? "已開始" : "尚未開始");
    if(streak) streak.textContent = String(st);
    if(coins) coins.textContent = String(c);
    if(budget) budget.textContent = String(b);
    if(sessions) sessions.textContent = String(s);

    if(monthPill){
      monthPill.textContent = (s>0 ? "本月進行中" : "本月尚未開始");
    }
    if(chestText){
      chestText.textContent = (opened ? "已開啟" : "尚未解鎖");
    }

    var mini = qs("miniTip");
    if(mini){
      if(s===0) mini.textContent = "提示：先「停一下」，再做選擇。";
      else mini.textContent = "你已練功 "+s+" 次。慢慢來，越穩越有力。";
    }
  }

  // ====== 事件 ======
  function bind(){
    // 三卡
    var cards = document.querySelectorAll(".aCard");
    for(var i=0;i<cards.length;i++){
      cards[i].addEventListener("click", function(){
        var a = this.getAttribute("data-action");
        addSession(a);
        alert("✅ 完成一次 "+actionName(a)+"\n+1 功德幣\n（這不是記帳，是把「選擇力」練回來）");
      });
    }

    var btnChest = qs("btnOpenChest");
    if(btnChest) btnChest.addEventListener("click", openChest);

    var btnHist = qs("btnHistory");
    if(btnHist) btnHist.addEventListener("click", function(){
      var hist;
      try{ hist = JSON.parse(localStorage.getItem(K.history) || "[]"); }
      catch(e){ hist = []; }
      if(!hist.length){
        alert("目前還沒有練功紀錄🙂\n點一張卡就會開始記錄。");
        return;
      }
      var lines = [];
      for(var i=0;i<Math.min(hist.length, 12);i++){
        var it = hist[i];
        lines.push((i+1)+". "+it.day+"｜"+actionName(it.action));
      }
      alert("最近練功紀錄（最多 12 筆）\n\n"+lines.join("\n"));
    });

    var btnSettings = qs("btnOpenSettings");
    if(btnSettings) btnSettings.addEventListener("click", function(){
      var current = parseInt(localStorage.getItem(K.budget) || "100", 10);
      var val = prompt("設定本月零用錢（元）\n（只改數字即可）", String(current));
      if(val==null) return;
      val = String(val).replace(/[^\d]/g,"");
      if(!val) return;
      localStorage.setItem(K.budget, String(parseInt(val,10)));
      render();
      alert("已更新本月零用錢🙂");
    });
  }

  // ====== 啟動 ======
  initMonth();
  bind();
  render();
  unlockFeedbackIfCompleted();
})();
