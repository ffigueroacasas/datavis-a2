window.onload = () => {
  d3.csv('cars.csv')
    .then((data) => {
      // Parse numeric fields into numbers
      data.forEach((d) => {
        d['Retail Price'] = +d['Retail Price'];
        d['Dealer Cost'] = +d['Dealer Cost'];
      });

      // Filter out rows with missing numeric values
      data = data.filter((d) => {
        return !isNaN(d['Retail Price']) && !isNaN(d['Dealer Cost']);
      });

      // Dimensions
      const margin = { top: 40, right: 160, bottom: 60, left: 70 },
        width = 900 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

      // Create SVG
      const svg = d3
        .select('body')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // Scales
      const x = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d['Dealer Cost']))
        .nice()
        .range([0, width]);

      const y = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d['Retail Price']))
        .nice()
        .range([height, 0]);

      // Color scale for Type
      const types = Array.from(new Set(data.map((d) => d.Type))).sort();
      const color = d3.scaleOrdinal(d3.schemeCategory10).domain(types);

      // Axes
      const xAxis = d3.axisBottom(x).ticks(8).tickFormat(d3.format(',.0f'));
      const yAxis = d3.axisLeft(y).ticks(8).tickFormat(d3.format(',.0f'));

      svg
        .append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

      svg.append('g').call(yAxis);

      // Axis labels
      svg
        .append('text')
        .attr('class', 'x label')
        .attr('x', width / 2)
        .attr('y', height + 45)
        .attr('text-anchor', 'middle')
        .text('Dealer Cost');

      svg
        .append('text')
        .attr('class', 'y label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .attr('text-anchor', 'middle')
        .text('Retail Price');

      // Tooltip
      const tooltip = d3
        .select('body')
        .append('div')
        .style('position', 'absolute')
        .style('background', 'rgba(255,255,255,0.9)')
        .style('padding', '6px 8px')
        .style('border', '1px solid #999')
        .style('border-radius', '4px')
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('display', 'none');

      // Draw points
      svg
        .selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', function (d) {
          return x(d['Dealer Cost']);
        })
        .attr('cy', function (d) {
          return y(d['Retail Price']);
        })
        .attr('r', 4)
        .attr('fill', function (d) {
          return color(d.Type);
        })
        .attr('opacity', 0.85)
        .on('mouseover', function (d) {
          tooltip
            .style('display', 'block')
            .html(
              '<strong>' +
                (d.Name || '') +
                '</strong><br/>' +
                'Type: ' +
                (d.Type || '') +
                '<br/>' +
                'Dealer Cost: $' +
                d3.format(',')(d['Dealer Cost']) +
                '<br/>' +
                'Retail Price: $' +
                d3.format(',')(d['Retail Price'])
            );
          // position
          var px = d3.event.pageX + 10;
          var py = d3.event.pageY + 10;
          tooltip.style('left', px + 'px').style('top', py + 'px');
        })
        .on('mousemove', function () {
          var px = d3.event.pageX + 10;
          var py = d3.event.pageY + 10;
          tooltip.style('left', px + 'px').style('top', py + 'px');
        })
        .on('mouseout', function () {
          tooltip.style('display', 'none');
        });

      // Legend
      const legend = svg
        .append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate(' + (width + 20) + ',0)');

      types.forEach(function (t, i) {
        let g = legend
          .append('g')
          .attr('transform', 'translate(0,' + i * 20 + ')');
        g.append('rect')
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', color(t));
        g.append('text')
          .attr('x', 18)
          .attr('y', 10)
          .text(t)
          .style('font-size', '12px')
          .style('font-family', 'sans-serif');
      });
    })
    .catch(function (err) {
      console.error('Error loading or parsing data:', err);
    });
};
