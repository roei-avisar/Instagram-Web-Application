function openDashboard() {
    const feedSection = document.querySelector('.main-feed-section');
    const rightSidebar = document.querySelector('.right-sidebar');
    const dashboardSection = document.getElementById('dashboard-section');

    if (dashboardSection) { // hide post section and view the dashbord section
        feedSection.classList.add('d-none');
        rightSidebar.classList.add('d-none');
        
        dashboardSection.classList.remove('d-none');
        dashboardSection.classList.add('d-block');

        renderCommunitySizeChart(); 
        renderTopCreatorsChart();
        renderEngagementRateChart();
        renderMediaDistributionChart();
        renderPostsTimelineChart();
        
    }
}

document.querySelectorAll('.left-sidebar .menu-item').forEach(button => { // for each button in the nav bar except of nesaages, more, darkmode, dashboard make on clicl listener to move back to main section
    button.addEventListener('click', function() {
        if (this.id === 'theme-toggle' || this.classList.contains('js-dashboard-btn') || this.id === 'more-menu-btn' || this.id === 'messages-toggle') {
            return;
        }

        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection && !dashboardSection.classList.contains('d-none')) {
            const feedSection = document.querySelector('.main-feed-section');
            const rightSidebar = document.querySelector('.right-sidebar');
            
            dashboardSection.classList.remove('d-block');
            dashboardSection.classList.add('d-none');
            
            feedSection.classList.remove('d-none');
            rightSidebar.classList.remove('d-none');

            d3.select("#communitySizeChart").selectAll("*").remove();
            d3.select("#topCreatorsChart").selectAll("*").remove();
            d3.select("#engagementRateChart").selectAll("*").remove();
            d3.select("#mediaDistributionChart").selectAll("*").remove();
            d3.select("#postsTimelineChart").selectAll("*").remove();
        }
    });
});

async function renderCommunitySizeChart() {
    try {
        const response = await fetch('/api/statistics/community-size');
        const result = await response.json();
        if (!result.success || !result.data || result.data.length === 0) return;

        const data = result.data;
        const container = document.getElementById("communitySizeChart");
        const width = container.clientWidth || 600;
        const height = 300; 
        const margin = { top: 20, right: 20, bottom: 80, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        d3.select("#communitySizeChart").selectAll("*").remove();

        let tooltip = d3.select("body").select(".d3-tooltip");
        if (tooltip.empty()) tooltip = d3.select("body").append("div").attr("class", "d3-tooltip");

        const svg = d3.select("#communitySizeChart").append("svg")
            .attr("width", "100%").attr("height", height).attr("viewBox", `0 0 ${width} ${height}`)
            .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient").attr("id", "blueGradient")
            .attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
        gradient.append("stop").attr("offset", "0%").attr("stop-color", "#00c6ff");
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "#0072ff");

        const x = d3.scaleBand().domain(data.map(d => d.name)).range([0, innerWidth]).padding(0.4);
        const y = d3.scaleLinear().domain([0, (d3.max(data, d => d.usersCount) || 10)]).nice().range([innerHeight, 0]);

        svg.append("g").attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickSize(0)).selectAll("text").attr("class", "chart-axis-text")
            .attr("transform", "translate(-10,15)rotate(-45)").style("text-anchor", "end");

        svg.append("g").call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth))
            .selectAll("text").attr("class", "chart-axis-text");

        svg.selectAll(".domain").remove();
        svg.selectAll(".tick line").attr("class", "chart-grid-line");

        svg.selectAll(".bar").data(data).enter().append("rect").attr("class", "bar")
            .attr("x", d => {
                const bw = x.bandwidth();
                const actualWidth = Math.min(bw, 80);
                return x(d.name) + (bw - actualWidth) / 2;
            })
            .attr("y", innerHeight)
            .attr("width", d => Math.min(x.bandwidth(), 80))
            .attr("height", 0)
            .attr("fill", "url(#blueGradient)").attr("rx", 4).attr("ry", 4)
            .on("mouseover", function(event, d) {
                d3.select(this).transition().duration(200).attr("opacity", 0.7);
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`<strong>${d.name}</strong><br/>${d.usersCount} Members`)
                    .style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 35) + "px");
            })
            .on("mousemove", function(event) { tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 35) + "px"); })
            .on("mouseout", function() {
                d3.select(this).transition().duration(200).attr("opacity", 1);
                tooltip.transition().duration(500).style("opacity", 0);
            })
            .transition().duration(800).delay((d, i) => i * 100)
            .attr("y", d => y(d.usersCount)).attr("height", d => innerHeight - y(d.usersCount));

    } catch (error) { console.error(error); }
}


async function renderMediaDistributionChart() {
    try {
        const response = await fetch('/api/statistics/media-distribution');
        const result = await response.json();
        if (!result.success || !result.data || result.data.length === 0) return;

        const data = result.data;
        const container = document.getElementById("mediaDistributionChart");
        const width = container.clientWidth || 400;
        const height = 300;
        const radius = Math.min(width, height) / 2.5;

        d3.select("#mediaDistributionChart").selectAll("*").remove();

        let tooltip = d3.select("body").select(".d3-tooltip");
        if (tooltip.empty()) tooltip = d3.select("body").append("div").attr("class", "d3-tooltip");

        const svg = d3.select("#mediaDistributionChart").append("svg")
            .attr("width", "100%").attr("height", height)
            .append("g").attr("transform", `translate(${width / 3.5},${height / 2})`);

        const color = d3.scaleOrdinal().domain(data.map(d => d._id))
            .range(["#6366f1", "#ec4899", "#14b8a6", "#f59e0b"]);

        const pie = d3.pie().value(d => d.count).sort(null).padAngle(0.04);
        const data_ready = pie(data);
        const arc = d3.arc().innerRadius(radius * 0.65).outerRadius(radius).cornerRadius(6);

        svg.selectAll('path').data(data_ready).enter().append('path')
            .attr('d', arc).attr('fill', d => color(d.data._id))
            .style("opacity", 0)
            .on("mouseover", function(event, d) {
                d3.select(this).transition().duration(200).attr("transform", "scale(1.05)");
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`<strong>${d.data._id}</strong><br/>${d.data.count} Items`)
                    .style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 35) + "px");
            })
            .on("mousemove", function(event) { tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 35) + "px"); })
            .on("mouseout", function() {
                d3.select(this).transition().duration(200).attr("transform", "scale(1)");
                tooltip.transition().duration(500).style("opacity", 0);
            })
            .transition().duration(800).style("opacity", 1)
            .attrTween("d", function(d) {
                const i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
                return function(t) { d.endAngle = i(t); return arc(d); }
            });

        const legend = svg.selectAll(".legend")
            .data(data_ready).enter().append("g")
            .attr("transform", (d, i) => `translate(${radius + 50}, ${i * 30 - (data.length * 30) / 2})`);

        legend.append("rect").attr("width", 14).attr("height", 14).attr("rx", 4)
            .attr("fill", d => color(d.data._id));

        legend.append("text").attr("x", 24).attr("y", 12)
            .text(d => `${d.data._id} (${d.data.count})`)
            .attr("class", "chart-axis-text").style("font-size", "14px");

    } catch (error) { console.error(error); }
}

async function renderEngagementRateChart() {
    try {
        const response = await fetch('/api/statistics/engagement-rate');
        const result = await response.json();
        if (!result.success || !result.data || result.data.length === 0) return;

        const data = result.data;
        const container = document.getElementById("engagementRateChart");
        const width = container.clientWidth || 600;
        const height = 300; 
        const margin = { top: 20, right: 20, bottom: 80, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        d3.select("#engagementRateChart").selectAll("*").remove();

        let tooltip = d3.select("body").select(".d3-tooltip");
        if (tooltip.empty()) tooltip = d3.select("body").append("div").attr("class", "d3-tooltip");

        const svg = d3.select("#engagementRateChart").append("svg")
            .attr("width", "100%").attr("height", height).attr("viewBox", `0 0 ${width} ${height}`)
            .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient").attr("id", "orangeGradient")
            .attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
        gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ff9a44");
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "#fc6076");

        const x = d3.scaleBand().domain(data.map(d => d.name)).range([0, innerWidth]).padding(0.4);
        const getValue = d => d.engagementRatio !== undefined ? d.engagementRatio : 0;
        const y = d3.scaleLinear().domain([0, (d3.max(data, d => getValue(d)) || 10)]).nice().range([innerHeight, 0]);

        svg.append("g").attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickSize(0)).selectAll("text").attr("class", "chart-axis-text")
            .attr("transform", "translate(-10,15)rotate(-45)").style("text-anchor", "end");

        svg.append("g").call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth))
            .selectAll("text").attr("class", "chart-axis-text");

        svg.selectAll(".domain").remove();
        svg.selectAll(".tick line").attr("class", "chart-grid-line");

        svg.selectAll(".bar").data(data).enter().append("rect").attr("class", "bar")
            .attr("x", d => {
                const bw = x.bandwidth();
                const actualWidth = Math.min(bw, 80);
                return x(d.name) + (bw - actualWidth) / 2;
            })
            .attr("y", innerHeight)
            .attr("width", d => Math.min(x.bandwidth(), 80))
            .attr("height", 0)
            .attr("fill", "url(#orangeGradient)").attr("rx", 4).attr("ry", 4)
            .on("mouseover", function(event, d) {
                d3.select(this).transition().duration(200).attr("opacity", 0.7);
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`<strong>${d.name}</strong><br/>${getValue(d).toFixed(2)} Rate`)
                    .style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 35) + "px");
            })
            .on("mousemove", function(event) { tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 35) + "px"); })
            .on("mouseout", function() {
                d3.select(this).transition().duration(200).attr("opacity", 1);
                tooltip.transition().duration(500).style("opacity", 0);
            })
            .transition().duration(800).delay((d, i) => i * 100)
            .attr("y", d => y(getValue(d))).attr("height", d => innerHeight - y(getValue(d)));

    } catch (error) { console.error(error); }
}

async function renderPostsTimelineChart() {
    try {
        const response = await fetch('/api/statistics/posts-timeline');
        const result = await response.json();
        if (!result.success || !result.data || result.data.length === 0) return;

        const formattedData = result.data.map(d => ({
            label: `${d._id.day}/${d._id.month}`,
            count: d.count
        }));

        const container = document.getElementById("postsTimelineChart");
        const canvas = document.getElementById("postsTimelineCanvas");
        const width = container.clientWidth || 800;
        const height = 300;
        const margin = { top: 20, right: 20, bottom: 80, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        const maxCount = Math.max(10, ...formattedData.map(d => d.count));
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Scale the backing store for sharp rendering on high-density displays.
        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;
        canvas.style.width = "100%";
        canvas.style.height = `${height}px`;

        const context = canvas.getContext("2d");
        context.scale(devicePixelRatio, devicePixelRatio);
        context.clearRect(0, 0, width, height);
        context.font = "13px Segoe UI, sans-serif";
        context.lineWidth = 1;
        context.strokeStyle = "#e9ecef";
        context.fillStyle = "#6c757d";

        // Keep data-to-pixel conversion in one place for the axes, line, and points.
        const getX = index => margin.left + (formattedData.length === 1
            ? innerWidth / 2
            : index * innerWidth / (formattedData.length - 1));
        const getY = count => margin.top + innerHeight - (count / maxCount) * innerHeight;
        const tickCount = 5;

        for (let tick = 0; tick <= tickCount; tick++) {
            const value = maxCount * tick / tickCount;
            const y = getY(value);
            context.beginPath();
            context.moveTo(margin.left, y);
            context.lineTo(width - margin.right, y);
            context.stroke();
            context.fillText(Math.round(value), 8, y + 4);
        }

        context.textAlign = "center";
        formattedData.forEach((item, index) => {
            const x = getX(index);
            context.save();
            context.translate(x - 8, height - margin.bottom + 15);
            context.rotate(-Math.PI / 4);
            context.fillText(item.label, 0, 0);
            context.restore();
        });

        context.beginPath();
        formattedData.forEach((item, index) => {
            const x = getX(index);
            const y = getY(item.count);
            if (index === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        });
        context.strokeStyle = "#00c6ff";
        context.lineWidth = 3;
        context.stroke();

        formattedData.forEach((item, index) => {
            context.beginPath();
            context.arc(getX(index), getY(item.count), 5, 0, Math.PI * 2);
            context.fillStyle = "#0C1014";
            context.fill();
            context.strokeStyle = "#00c6ff";
            context.lineWidth = 2;
            context.stroke();
        });

        let tooltip = d3.select("body").select(".d3-tooltip");
        if (tooltip.empty()) tooltip = d3.select("body").append("div").attr("class", "d3-tooltip");

        // Canvas has no individual point elements, so find the nearest point manually.
        canvas.onmousemove = event => {
            const bounds = canvas.getBoundingClientRect();
            const mouseX = event.clientX - bounds.left;
            const mouseY = event.clientY - bounds.top;
            const nearestIndex = formattedData.reduce((closest, item, index) =>
                Math.abs(getX(index) - mouseX) < Math.abs(getX(closest) - mouseX) ? index : closest, 0);
            const nearestX = getX(nearestIndex);
            const nearestY = getY(formattedData[nearestIndex].count);
            const isNearPoint = Math.hypot(mouseX - nearestX, mouseY - nearestY) < 14;

            canvas.style.cursor = isNearPoint ? "pointer" : "default";
            if (isNearPoint) {
                const item = formattedData[nearestIndex];
                tooltip.style("opacity", 1)
                    .html(`<strong>${item.label}</strong><br/>${item.count} Posts`)
                    .style("left", `${event.pageX + 15}px`)
                    .style("top", `${event.pageY - 35}px`);
            } else {
                tooltip.style("opacity", 0);
            }
        };

        canvas.onmouseleave = () => {
            canvas.style.cursor = "default";
            tooltip.style("opacity", 0);
        };

    } catch (error) { console.error(error); }
}

async function renderTopCreatorsChart() {
    try {
        const response = await fetch('/api/statistics/top-creators');
        const result = await response.json();
        if (!result.success || !result.data || result.data.length === 0) return;

        const data = result.data;
        const container = document.getElementById("topCreatorsChart");
        const width = container.clientWidth || 600;
        const height = 300; 
        const margin = { top: 20, right: 20, bottom: 80, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        d3.select("#topCreatorsChart").selectAll("*").remove();

        let tooltip = d3.select("body").select(".d3-tooltip");
        if (tooltip.empty()) tooltip = d3.select("body").append("div").attr("class", "d3-tooltip");

        const svg = d3.select("#topCreatorsChart").append("svg")
            .attr("width", "100%").attr("height", height).attr("viewBox", `0 0 ${width} ${height}`)
            .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient").attr("id", "purpleGradient")
            .attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
        gradient.append("stop").attr("offset", "0%").attr("stop-color", "#b224ef");
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "#7579ff");

        const x = d3.scaleBand().domain(data.map(d => d.username)).range([0, innerWidth]).padding(0.4);
        const y = d3.scaleLinear().domain([0, (d3.max(data, d => d.postCount) || 10)]).nice().range([innerHeight, 0]);

        svg.append("g").attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickSize(0)).selectAll("text").attr("class", "chart-axis-text")
            .attr("transform", "translate(-10,15)rotate(-45)").style("text-anchor", "end");

        svg.append("g").call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth))
            .selectAll("text").attr("class", "chart-axis-text");

        svg.selectAll(".domain").remove();
        svg.selectAll(".tick line").attr("class", "chart-grid-line");

        svg.selectAll(".bar").data(data).enter().append("rect").attr("class", "bar")
            .attr("x", d => {
                const bw = x.bandwidth();
                const actualWidth = Math.min(bw, 80);
                return x(d.username) + (bw - actualWidth) / 2;
            })
            .attr("y", innerHeight)
            .attr("width", d => Math.min(x.bandwidth(), 80))
            .attr("height", 0)
            .attr("fill", "url(#purpleGradient)").attr("rx", 4).attr("ry", 4)
            .on("mouseover", function(event, d) {
                d3.select(this).transition().duration(200).attr("opacity", 0.7);
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`<strong>${d.username}</strong><br/>${d.postCount} Posts`)
                    .style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 35) + "px");
            })
            .on("mousemove", function(event) { tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 35) + "px"); })
            .on("mouseout", function() {
                d3.select(this).transition().duration(200).attr("opacity", 1);
                tooltip.transition().duration(500).style("opacity", 0);
            })
            .transition().duration(800).delay((d, i) => i * 100)
            .attr("y", d => y(d.postCount)).attr("height", d => innerHeight - y(d.postCount));

    } catch (error) { console.error(error); }
}