export function topologicalSort(graph: { [key: string]: string[] }): string[] {
  let visited: { [key: string]: boolean } = {};
  let stack: string[] = [];
  
  for (let node in graph) {
    if (!visited[node]) {
      topologicalSortUtil(node, visited, stack, graph);
    }
  }
  
  return stack
}

function topologicalSortUtil(node: string, visited: { [key: string]: boolean }, stack: string[], graph: {
  [key: string]: string[]
}) {
  visited[node] = true;
  
  for (let neighbor of graph[node]) {
    if (!visited[neighbor]) {
      topologicalSortUtil(neighbor, visited, stack, graph);
    }
  }
  
  stack.push(node);
}
