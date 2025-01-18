import { Link } from './types';

export function highlighLink(linkSelection: d3.Selection<any, Link, any, any>, link: Link) {
    linkSelection.filter(l => l === link)
        .transition()
        .duration(200)
        .attr("stroke-width", 3)
        .style("opacity", 1);
}

export function unhighlightLink(linkSelection: d3.Selection<any, Link, any, any>, link: Link) {
    linkSelection.filter(l => l === link)
        .transition()
        .duration(200)
        .attr("stroke-width", 1.5)
        .style("opacity", 1);
}