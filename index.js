const puppeteer = require('puppeteer');


(async () => {
	const fbPage = 'traderBasic'
	const url = 'https://facebook.com/' + fbPage
	var level = 3
	var count = 1

	const browser = await puppeteer.launch({headless: false});
	const page = await browser.newPage();
	
	var data = {}
	var flatten_data = []

	var bfs_queue = [{id: count, url: url}]


	while(bfs_queue.length > 0 && flatten_data.length < 100){
		console.log(count)

		var thisQueueNode = bfs_queue.shift()
		var children = await get(thisQueueNode)

		bfs_queue = bfs_queue.concat(children)
	}

	await browser.close();

	console.log('done getting all data')
	console.log(JSON.stringify(flatten_data))



	async function get(node){
		var res = await crawl(node['url'])

		var links = res['links'].filter((l) => {
			var find = flatten_data.find((fd) => {
				return fd['url'] == l['url']
			})
			return !find;
		})

		links = links.map((l) => {
			count = count + 1;
			return {id: count, url: l, parent: node['id']}
		})

		flatten_data.push({
			id: node['id'],
			url: node['url'],
			likes: res['likes'],
			parent: node['parent'] ? node['parent'] : null
		})

		return links;
	}


	async function crawl(url){
		await page.goto(url);
		// https://www.w3schools.com/xml/xpath_syntax.asp

		let likeDiv = (await page.$x("//div[contains(text(), 'คนถูกใจสิ่งนี้')]"))[0];
		let getProp = await likeDiv.getProperty('innerHTML')
		let likes = await getProp.jsonValue()

		// https://github.com/GoogleChrome/puppeteer/issues/628
		let allLinks = await page.evaluate(() => {
			var aTags = document.getElementsByTagName('a')
			return [].map.call(aTags, a => a.href)
		});
		allLinks = allLinks.filter((l) => {
			var find = flatten_data.find((d) => {
				return (d['url'].indexOf(l) > -1) || (l.indexOf(d['url']) > -1)
			})

			return ((l.indexOf("ref=py_c") > -1) && (find == undefined) && (l.indexOf(url) == -1))
		})

		// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-an-array-remove-duplicates
		let unique = [...new Set(allLinks)]; 

		return {likes: likes, links: unique};
	}
})();