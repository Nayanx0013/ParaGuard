const endpoint = 'http://localhost:3000/api/humanize';

const testSamples = [
  { name: "1. ChatGPT Standard", text: "In today's rapidly evolving digital landscape, it is important to note that artificial intelligence plays a pivotal role. Furthermore, we must seamlessly utilize this groundbreaking technology to enhance our comprehensive strategies. Ultimately, this paradigm shift is a testament to human innovation." },
  { name: "2. Heavy Academic AI", text: "The utilization of scalable ecosystems can significantly streamline the holistic development of robust infrastructures. As previously mentioned, actionable insights are crucial. In summary, it goes without saying that these methodologies enhance synergies." },
  { name: "3. Short AI paragraph", text: "This is a new tool. The tool is very fast. In fact, it is the best. It helps everyone. It works well." },
  { name: "4. Human Essay", text: "When I first looked at the data, I honestly couldn't believe it. Sure, we all knew things were changing, but seeing the actual numbers drop by 40% in just two months? That's wild. It made me completely rethink how we've been approaching the entire project." },
  { name: "5. Mixed text", text: "It is worth noting that the results were mixed. I talked to the team yesterday and they seem pretty exhausted by the new schedule. However, furthermore we must optimize our synergistic workflows to ensure maximum productivity." }
];

async function run() {
    console.log("=========================================");
    console.log("    PARAGUARD HUMANIZER TEST SUITE       ");
    console.log("=========================================\n");

    for (const sample of testSamples) {
        console.log(`\nTesting Sample: ${sample.name}`);
        console.log(`Length: ${sample.text.split(' ').length} words`);
        
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({text: sample.text})
            });
            const data = await res.json();
            
            if (data.error) {
                console.error(`Error: ${data.error}`);
                continue;
            }

            console.log(`  -> Original Score: ${Math.round(data.originalScore)}/100 (Higher is more human)`);
            console.log(`  -> Final Score (Combined): ${Math.round(data.combinedScore || data.finalScore)}/100`);
            console.log(`  -> Passes Used: ${data.passesUsed}`);
            
            const passGptZero = (data.combinedScore || data.finalScore) > 65;
            console.log(`  -> Would pass GPTZero? ${passGptZero ? '✅ YES' : '❌ NO'}`);
            
            console.log(`\n  Preview of humanized text:`);
            console.log(`  "${data.humanizedText.substring(0, 150)}..."`);
            console.log("-".repeat(50));
            
        } catch(e) {
            console.error(e);
        }
        
        // Wait 2 seconds between tests to be nice to the API limits
        await new Promise(r => setTimeout(r, 2000));
    }
}

run();