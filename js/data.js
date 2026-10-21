/* ============================================================
   FitLife 360 — data.js
   Built-in databases: Indian foods, exercises, workout plans.

   IMPORTANT (honesty note for buyers/users):
   Nutrition values below are APPROXIMATE starter estimates for
   common preparations, not lab measurements. The app labels them
   as estimates everywhere and lets users correct portions or add
   custom foods. Never present these as exact values.
   Units: kcal, protein/carbs/fat/fiber in grams per `per` amount.
   ============================================================ */
'use strict';

const DB = (() => {

  /* ---------------- INDIAN FOOD DATABASE ----------------
     per: reference amount. unit: 'g' | 'ml' | 'pc'.
     All values approximate estimates.                    */
  const FOODS = [
    // Breads & grains
    { id:'f_roti', name:'Roti / Chapati (whole wheat)', per:1, unit:'pc', pcWeightG:30, kcal:90,  p:3,   c:18,  f:1,   fiber:2.5, tags:['veg','vegan'] },
    { id:'f_rice', name:'Cooked Rice (white)', per:100, unit:'g', kcal:130, p:2.7, c:28,  f:0.3, fiber:0.4, tags:['veg','vegan'] },
    { id:'f_brownrice', name:'Cooked Brown Rice', per:100, unit:'g', kcal:123, p:2.7, c:26, f:1, fiber:1.6, tags:['veg','vegan'] },
    { id:'f_poha', name:'Poha', per:100, unit:'g', kcal:130, p:2.5, c:27,  f:1.5, fiber:1.2, tags:['veg','vegan'] },
    { id:'f_idli', name:'Idli', per:1, unit:'pc', pcWeightG:40, kcal:60,  p:2,   c:12,  f:0.5, fiber:0.8, tags:['veg','vegan'] },
    { id:'f_dosa', name:'Plain Dosa', per:1, unit:'pc', pcWeightG:80, kcal:170, p:4,   c:30,  f:4,   fiber:1,   tags:['veg'] },
    { id:'f_upma', name:'Upma (rava)', per:100, unit:'g', kcal:130, p:3,   c:22,  f:3.5, fiber:1.5, tags:['veg'] },
    { id:'f_oats', name:'Oats (dry)', per:100, unit:'g', kcal:389, p:17,  c:66,  f:7,   fiber:10,  tags:['veg','vegan'] },
    { id:'f_paratha', name:'Aloo Paratha (1, with oil)', per:1, unit:'pc', pcWeightG:100, kcal:240, p:5, c:35, f:9, fiber:3, tags:['veg'] },
    { id:'f_bread', name:'Whole Wheat Bread', per:1, unit:'pc', pcWeightG:25, kcal:70, p:3, c:13, f:1, fiber:2, tags:['veg','vegan'] },
    // Dals & legumes
    { id:'f_dal', name:'Dal (cooked, tadka)', per:100, unit:'g', kcal:105, p:7,   c:16,  f:2.5, fiber:4,   tags:['veg','vegan'] },
    { id:'f_rajma', name:'Rajma Curry', per:100, unit:'g', kcal:120, p:7,   c:19,  f:2.5, fiber:5,   tags:['veg','vegan'] },
    { id:'f_chana', name:'Chana Masala (kabuli)', per:100, unit:'g', kcal:140, p:7,   c:22,  f:3.5, fiber:6,   tags:['veg','vegan'] },
    { id:'f_moong', name:'Moong Dal (cooked)', per:100, unit:'g', kcal:100, p:7,   c:17,  f:1,   fiber:4,   tags:['veg','vegan'] },
    { id:'f_sprouts', name:'Mixed Sprouts', per:100, unit:'g', kcal:90,  p:7,   c:15,  f:1,   fiber:4,   tags:['veg','vegan'] },
    // Paneer / soy
    { id:'f_paneer', name:'Paneer (plain)', per:100, unit:'g', kcal:265, p:18,  c:3.5, f:20,  fiber:0,   tags:['veg'] },
    { id:'f_paneer_bhurji', name:'Paneer Bhurji', per:100, unit:'g', kcal:180, p:12,  c:5,   f:13,  fiber:1,   tags:['veg'] },
    { id:'f_soya', name:'Soya Chunks (dry)', per:100, unit:'g', kcal:345, p:52,  c:33,  f:0.5, fiber:13,  tags:['veg','vegan'] },
    { id:'f_tofu', name:'Tofu', per:100, unit:'g', kcal:80,  p:8,   c:2,   f:5,   fiber:0.5, tags:['veg','vegan'] },
    // Sabzi
    { id:'f_sabzi', name:'Mixed Veg Sabzi (little oil)', per:100, unit:'g', kcal:80, p:2.5, c:12, f:3, fiber:3, tags:['veg','vegan'] },
    { id:'f_palaksabzi', name:'Palak Sabzi', per:100, unit:'g', kcal:60, p:3, c:8, f:2.5, fiber:3, tags:['veg','vegan'] },
    { id:'f_aloo', name:'Aloo Sabzi', per:100, unit:'g', kcal:110, p:2.5, c:20, f:3, fiber:2.5, tags:['veg','vegan'] },
    { id:'f_bhindi', name:'Bhindi Sabzi', per:100, unit:'g', kcal:90, p:2.5, c:12, f:4, fiber:4, tags:['veg','vegan'] },
    // Dairy & eggs
    { id:'f_milk', name:'Cow Milk', per:100, unit:'ml', kcal:65, p:3.3, c:4.8, f:3.6, fiber:0, tags:['veg'] },
    { id:'f_curd', name:'Curd / Dahi', per:100, unit:'g', kcal:60, p:3.2, c:4.5, f:3, fiber:0, tags:['veg'] },
    { id:'f_buttermilk', name:'Chaas / Buttermilk', per:100, unit:'ml', kcal:30, p:1.5, c:4, f:1, fiber:0, tags:['veg'] },
    { id:'f_egg', name:'Boiled Egg', per:1, unit:'pc', pcWeightG:50, kcal:75, p:6.5, c:0.6, f:5, fiber:0, tags:['nonveg','egg'] },
    { id:'f_eggcurry', name:'Egg Curry (2 eggs)', per:100, unit:'g', kcal:140, p:9, c:5, f:10, fiber:1, tags:['nonveg','egg'] },
    // Non-veg
    { id:'f_chicken', name:'Chicken Curry (with gravy)', per:100, unit:'g', kcal:160, p:20, c:5, f:7, fiber:0.5, tags:['nonveg'] },
    { id:'f_chicken_tandoori', name:'Tandoori Chicken', per:100, unit:'g', kcal:150, p:24, c:2, f:5, fiber:0, tags:['nonveg'] },
    { id:'f_fish', name:'Fish Curry', per:100, unit:'g', kcal:140, p:20, c:4, f:5, fiber:0.5, tags:['nonveg'] },
    // Fruits
    { id:'f_banana', name:'Banana', per:1, unit:'pc', pcWeightG:120, kcal:105, p:1.3, c:27, f:0.4, fiber:3, tags:['veg','vegan'] },
    { id:'f_apple', name:'Apple', per:1, unit:'pc', pcWeightG:180, kcal:95, p:0.5, c:25, f:0.3, fiber:4.5, tags:['veg','vegan'] },
    { id:'f_orange', name:'Orange', per:1, unit:'pc', pcWeightG:150, kcal:70, p:1.3, c:18, f:0.2, fiber:3.5, tags:['veg','vegan'] },
    { id:'f_mango', name:'Mango', per:100, unit:'g', kcal:60, p:0.8, c:15, f:0.4, fiber:1.6, tags:['veg','vegan'] },
    { id:'f_papaya', name:'Papaya', per:100, unit:'g', kcal:43, p:0.5, c:11, f:0.3, fiber:1.7, tags:['veg','vegan'] },
    { id:'f_grapes', name:'Grapes', per:100, unit:'g', kcal:70, p:0.7, c:18, f:0.2, fiber:0.9, tags:['veg','vegan'] },
    // Nuts & snacks
    { id:'f_almonds', name:'Almonds', per:100, unit:'g', kcal:580, p:21, c:22, f:50, fiber:12, tags:['veg','vegan'] },
    { id:'f_peanuts', name:'Peanuts (roasted)', per:100, unit:'g', kcal:567, p:26, c:16, f:49, fiber:8.5, tags:['veg','vegan'] },
    { id:'f_makhana', name:'Makhana (roasted)', per:100, unit:'g', kcal:350, p:9, c:77, f:0.5, fiber:3, tags:['veg','vegan'] },
    // Fats & extras
    { id:'f_ghee', name:'Ghee', per:1, unit:'tbsp', kcal:120, p:0, c:0, f:14, fiber:0, tags:['veg'] },
    { id:'f_oil', name:'Cooking Oil', per:1, unit:'tbsp', kcal:120, p:0, c:0, f:14, fiber:0, tags:['veg','vegan'] },
    { id:'f_sugar', name:'Sugar', per:1, unit:'tsp', kcal:16, p:0, c:4, f:0, fiber:0, tags:['veg','vegan'] },
    { id:'f_honey', name:'Honey', per:1, unit:'tsp', kcal:21, p:0, c:6, f:0, fiber:0, tags:['veg'] },
    // Beverages
    { id:'f_chai', name:'Chai (with milk + sugar)', per:100, unit:'ml', kcal:60, p:2, c:8, f:2.5, fiber:0, tags:['veg'] },
    { id:'f_coffee', name:'Filter Coffee (milk)', per:100, unit:'ml', kcal:55, p:2, c:7, f:2.5, fiber:0, tags:['veg'] },
    { id:'f_lassi', name:'Sweet Lassi', per:100, unit:'ml', kcal:90, p:2.5, c:14, f:3, fiber:0, tags:['veg'] },
    { id:'f_nimbu', name:'Nimbu Pani', per:100, unit:'ml', kcal:25, p:0, c:6, f:0, fiber:0, tags:['veg','vegan'] },
    // Common meals
    { id:'f_khichdi', name:'Dal Khichdi', per:100, unit:'g', kcal:120, p:5, c:21, f:2.5, fiber:2.5, tags:['veg','vegan'] },
    { id:'f_biryani_veg', name:'Veg Biryani', per:100, unit:'g', kcal:150, p:4, c:26, f:4, fiber:2, tags:['veg'] },
    { id:'f_biryani_chicken', name:'Chicken Biryani', per:100, unit:'g', kcal:170, p:10, c:22, f:5, fiber:1.5, tags:['nonveg'] },
    { id:'f_samosa', name:'Samosa', per:1, unit:'pc', pcWeightG:80, kcal:260, p:4, c:28, f:15, fiber:2.5, tags:['veg'] },
    { id:'f_pakora', name:'Mix Veg Pakora (4 pc)', per:100, unit:'g', kcal:290, p:6, c:25, f:19, fiber:3, tags:['veg'] },
    { id:'f_dhokla', name:'Dhokla', per:100, unit:'g', kcal:160, p:6, c:28, f:3, fiber:2, tags:['veg'] },
    { id:'f_sandwich', name:'Veg Sandwich', per:1, unit:'pc', pcWeightG:120, kcal:250, p:7, c:35, f:9, fiber:3, tags:['veg'] },
    { id:'f_maggo', name:'Masala Maggi (1 pack)', per:1, unit:'pc', pcWeightG:70, kcal:320, p:7, c:45, f:12, fiber:2, tags:['veg'] },
    { id:'f_pavbhaji', name:'Pav Bhaji (2 pav)', per:1, unit:'pc', pcWeightG:300, kcal:400, p:8, c:55, f:16, fiber:5, tags:['veg'] },
    { id:'f_cholebhature', name:'Chole Bhature (2 bhature)', per:1, unit:'pc', pcWeightG:350, kcal:650, p:16, c:80, f:28, fiber:8, tags:['veg'] },
  ];

  function findFood(id) {
    return FOODS.find(f => f.id === id) ||
      Storage.list(Storage.KEYS.customFoods).find(f => f.id === id) || null;
  }

  function searchFoods(query, dietPref) {
    const q = (query || '').trim().toLowerCase();
    const all = FOODS.concat(Storage.list(Storage.KEYS.customFoods));
    return all.filter(f => {
      if (dietPref === 'veg' && !(f.tags.includes('veg'))) return false;
      if (dietPref === 'vegan' && !(f.tags.includes('vegan'))) return false;
      if (!q) return true;
      return f.name.toLowerCase().includes(q);
    }).slice(0, 60);
  }

  /* nutrients for a given quantity.
     qty: number in the chosen unit. unit: 'g'|'ml'|'pc'|'cup'|'bowl'|'tbsp'|'tsp'
     Returns {kcal,p,c,f,fiber} — estimates. */
  const UNIT_TO_G = { g:1, ml:1, pc:null, cup:150, bowl:200, tbsp:15, tsp:5 };
  function foodNutrients(food, qty, unit) {
    let grams;
    if (unit === 'pc') {
      grams = (food.pcWeightG || 100) * qty;
    } else if (unit === 'g' || unit === 'ml') {
      grams = qty;
    } else {
      grams = (UNIT_TO_G[unit] || 100) * qty;
    }
    let refGrams;
    if (food.unit === 'pc') refGrams = (food.pcWeightG || 100) * food.per;
    else if (food.unit === 'tbsp' || food.unit === 'tsp') refGrams = food.per; // per-spoon entries
    else refGrams = food.per; // per 100 g/ml
    const factor = food.unit === 'tbsp' || food.unit === 'tsp'
      ? (unit === 'tbsp' || unit === 'tsp' ? qty / food.per : grams / ((UNIT_TO_G[unit]||15) * food.per))
      : grams / refGrams;
    const r = v => Math.round(v * factor * 10) / 10;
    return { kcal: r(food.kcal), p: r(food.p), c: r(food.c), f: r(food.f), fiber: r(food.fiber), grams: Math.round(grams) };
  }

  /* ---------------- EXERCISE LIBRARY ---------------- */
  const EXERCISES = [
    { id:'e_pushup', name:'Push-ups', muscle:'chest', level:'beginner', equipment:'none', sets:'3', reps:'8-12', rest:60, instructions:'Hands shoulder-width, body straight. Lower chest to floor, push back up. Keep core tight.' },
    { id:'e_squat', name:'Bodyweight Squats', muscle:'legs', level:'beginner', equipment:'none', sets:'3', reps:'12-15', rest:60, instructions:'Feet shoulder-width. Sit back as if into a chair, knees behind toes. Stand up tall.' },
    { id:'e_plank', name:'Plank', muscle:'core', level:'beginner', equipment:'none', sets:'3', reps:'30-60 sec', rest:45, instructions:'Forearms on floor, body in a straight line. Do not let hips sag. Breathe steadily.' },
    { id:'e_lunge', name:'Walking Lunges', muscle:'legs', level:'beginner', equipment:'none', sets:'3', reps:'10 each leg', rest:60, instructions:'Step forward, lower back knee toward floor. Front knee over ankle. Alternate legs.' },
    { id:'e_glutebridge', name:'Glute Bridge', muscle:'legs', level:'beginner', equipment:'none', sets:'3', reps:'12-15', rest:45, instructions:'Lie on back, knees bent. Lift hips, squeeze glutes at top. Lower slowly.' },
    { id:'e_superman', name:'Superman', muscle:'back', level:'beginner', equipment:'none', sets:'3', reps:'12', rest:45, instructions:'Lie face down. Lift arms, chest and legs together. Hold 2 sec, lower.' },
    { id:'e_wallpushup', name:'Wall Push-ups', muscle:'chest', level:'beginner', equipment:'none', sets:'3', reps:'12-15', rest:45, instructions:'Hands on wall at shoulder height. Lean in and push back. Easiest push-up variation.' },
    { id:'e_deadbug', name:'Dead Bug', muscle:'core', level:'beginner', equipment:'none', sets:'3', reps:'10 each side', rest:45, instructions:'On back, arms up, knees bent 90°. Extend opposite arm and leg slowly. Keep back flat.' },
    { id:'e_inclinepushup', name:'Incline Push-ups', muscle:'chest', level:'intermediate', equipment:'none', sets:'4', reps:'10-12', rest:60, instructions:'Hands on a chair/bed. Body straight. Lower chest, push up. Harder than wall, easier than floor.' },
    { id:'e_pike', name:'Pike Push-ups', muscle:'shoulders', level:'intermediate', equipment:'none', sets:'3', reps:'8-10', rest:60, instructions:'Hips high in an inverted V. Bend elbows to lower head toward floor. Push back up.' },
    { id:'e_bulgarian', name:'Bulgarian Split Squats', muscle:'legs', level:'intermediate', equipment:'none', sets:'3', reps:'8-10 each', rest:75, instructions:'Back foot on chair. Lower into lunge on front leg. Great single-leg strength builder.' },
    { id:'e_dips', name:'Chair Dips', muscle:'arms', level:'intermediate', equipment:'chair', sets:'3', reps:'8-12', rest:60, instructions:'Hands on chair edge behind you. Lower body by bending elbows to 90°. Push up.' },
    { id:'e_mountain', name:'Mountain Climbers', muscle:'core', level:'intermediate', equipment:'none', sets:'3', reps:'30 sec', rest:45, instructions:'Plank position. Drive knees to chest alternately, fast. Keep hips low.' },
    { id:'e_burpee', name:'Burpees', muscle:'full', level:'intermediate', equipment:'none', sets:'3', reps:'8-10', rest:90, instructions:'Squat, jump back to plank, push-up optional, jump feet in, jump up. Full-body conditioning.' },
    { id:'e_pullupneg', name:'Negative Pull-ups', muscle:'back', level:'intermediate', equipment:'bar', sets:'4', reps:'5', rest:90, instructions:'Jump to top of bar. Lower yourself as slowly as possible (5 sec). Builds pull-up strength.' },
    { id:'e_diamond', name:'Diamond Push-ups', muscle:'arms', level:'advanced', equipment:'none', sets:'4', reps:'8-10', rest:75, instructions:'Hands in diamond under chest. Lower and push. Targets triceps heavily.' },
    { id:'e_pistol', name:'Pistol Squat (assisted)', muscle:'legs', level:'advanced', equipment:'none', sets:'3', reps:'5 each', rest:90, instructions:'Hold a doorframe. Single-leg squat as low as possible. Advanced — build up slowly.' },
    { id:'e_handstand', name:'Wall Handstand Hold', muscle:'shoulders', level:'advanced', equipment:'wall', sets:'4', reps:'20-30 sec', rest:90, instructions:'Kick up against a wall. Keep body tight, shoulders active. Advanced shoulder builder.' },
    { id:'e_archer', name:'Archer Push-ups', muscle:'chest', level:'advanced', equipment:'none', sets:'3', reps:'6 each side', rest:90, instructions:'Wide push-up position. Shift weight to one arm while the other stays straight. Alternate.' },
    { id:'e_hanging', name:'Dead Hang', muscle:'back', level:'beginner', equipment:'bar', sets:'3', reps:'20-40 sec', rest:60, instructions:'Hang from a bar with straight arms. Builds grip and decompresses spine.' },
    { id:'e_calfraise', name:'Calf Raises', muscle:'legs', level:'beginner', equipment:'none', sets:'3', reps:'15-20', rest:45, instructions:'Stand on edge of a step. Rise onto toes, pause, lower below step level.' },
    { id:'e_birdog', name:'Bird Dog', muscle:'core', level:'beginner', equipment:'none', sets:'3', reps:'10 each side', rest:45, instructions:'On all fours. Extend opposite arm and leg. Keep hips level. Great for back safety.' },
    { id:'e_sideplank', name:'Side Plank', muscle:'core', level:'intermediate', equipment:'none', sets:'3', reps:'20-40 sec/side', rest:45, instructions:'On one forearm, body straight sideways. Targets obliques.' },
    { id:'e_jumpingjack', name:'Jumping Jacks', muscle:'full', level:'beginner', equipment:'none', sets:'3', reps:'30 sec', rest:30, instructions:'Jump feet out while arms go overhead. Light cardio warm-up.' },
  ];

  const MUSCLES = ['chest','back','shoulders','arms','legs','core','full'];

  /* ---------------- WORKOUT PLANS ---------------- */
  const PLANS = [
    {
      id:'plan_beginner_home', name:'Beginner Home Starter', level:'beginner', location:'home',
      desc:'3 days/week, no equipment. Build the habit safely.',
      days:[
        { day:'Day 1 — Full Body', exercises:['e_wallpushup','e_squat','e_glutebridge','e_deadbug','e_jumpingjack'] },
        { day:'Day 2 — Rest / Walk', exercises:[] },
        { day:'Day 3 — Full Body', exercises:['e_inclinepushup','e_lunge','e_superman','e_birdog','e_plank'] },
        { day:'Day 4 — Rest', exercises:[] },
        { day:'Day 5 — Full Body', exercises:['e_wallpushup','e_squat','e_calfraise','e_deadbug','e_jumpingjack'] },
      ]
    },
    {
      id:'plan_inter_home', name:'Intermediate Home Strength', level:'intermediate', location:'home',
      desc:'4 days/week, bodyweight + chair. Push strength up.',
      days:[
        { day:'Day 1 — Push', exercises:['e_pushup','e_pike','e_dips','e_plank','e_mountain'] },
        { day:'Day 2 — Legs', exercises:['e_squat','e_bulgarian','e_lunge','e_glutebridge','e_calfraise'] },
        { day:'Day 3 — Rest', exercises:[] },
        { day:'Day 4 — Push + Core', exercises:['e_inclinepushup','e_diamond','e_sideplank','e_deadbug','e_burpee'] },
        { day:'Day 5 — Legs + Back', exercises:['e_bulgarian','e_squat','e_superman','e_birdog','e_jumpingjack'] },
      ]
    },
    {
      id:'plan_adv_home', name:'Advanced Calisthenics', level:'advanced', location:'home',
      desc:'5 days/week. Serious bodyweight strength.',
      days:[
        { day:'Day 1 — Push', exercises:['e_archer','e_diamond','e_pike','e_handstand','e_plank'] },
        { day:'Day 2 — Legs', exercises:['e_pistol','e_bulgarian','e_squat','e_glutebridge','e_calfraise'] },
        { day:'Day 3 — Pull + Core', exercises:['e_pullupneg','e_hanging','e_superman','e_sideplank','e_mountain'] },
        { day:'Day 4 — Rest', exercises:[] },
        { day:'Day 5 — Full Body', exercises:['e_burpee','e_archer','e_pistol','e_dips','e_deadbug'] },
      ]
    },
    {
      id:'plan_gym_beginner', name:'Gym Beginner (substitutions)', level:'beginner', location:'gym',
      desc:'Same beginner structure — swap in dumbbell/machine equivalents at the gym.',
      days:[
        { day:'Day 1 — Full Body', exercises:['e_pushup','e_squat','e_superman','e_plank','e_jumpingjack'] },
        { day:'Day 3 — Full Body', exercises:['e_inclinepushup','e_lunge','e_birdog','e_deadbug','e_calfraise'] },
        { day:'Day 5 — Full Body', exercises:['e_wallpushup','e_glutebridge','e_dips','e_sideplank','e_mountain'] },
      ]
    },
  ];

  function exerciseById(id) {
    return EXERCISES.find(e => e.id === id) || null;
  }

  /* ---------------- helpers ---------------- */

  // Mifflin-St Jeor. Returns {bmr, tdee, targets:{kcal,proteinG,carbsG,fatG}}
  function calcTargets(profile) {
    const w = Number(profile.weightKg) || 70;
    const h = Number(profile.heightCm) || 170;
    const a = Number(profile.age) || 25;
    const male = (profile.gender || 'male') === 'male';
    const bmr = Math.round(10 * w + 6.25 * h - 5 * a + (male ? 5 : -161));
    const act = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, athlete:1.9 }[profile.activity] || 1.375;
    const tdee = Math.round(bmr * act);
    const goal = profile.goal || 'health';
    let kcal = tdee, note = 'Estimated maintenance calories.';
    if (goal === 'lose') { kcal = Math.max(1500, tdee - 400); note = 'Moderate deficit (~400 kcal). Never go below 1500 without professional guidance.'; }
    if (goal === 'gain' || goal === 'muscle') { kcal = tdee + 250; note = 'Small surplus (~250 kcal) for steady muscle gain.'; }
    // Protein: 1.6–2.2 g/kg for muscle/strength, else 1.2–1.6
    const pPerKg = (goal === 'muscle' || goal === 'strength') ? 1.8 : 1.4;
    const proteinG = Math.round(w * pPerKg);
    const fatG = Math.round((kcal * 0.25) / 9);
    const carbsG = Math.round((kcal - proteinG * 4 - fatG * 9) / 4);
    return { bmr, tdee, targets: { kcal, proteinG, carbsG, fatG }, note,
             disclaimer: 'Estimates only, not medical advice. Consult a professional for personal guidance.' };
  }

  function csvEscape(v) {
    const s = String(v === null || v === undefined ? '' : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function toCSV(rows) {
    return rows.map(r => r.map(csvEscape).join(',')).join('\n');
  }

  return {
    FOODS, EXERCISES, MUSCLES, PLANS,
    findFood, searchFoods, foodNutrients, exerciseById,
    calcTargets, csvEscape, downloadFile, toCSV
  };
})();
