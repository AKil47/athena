export interface HistoryEntry {
    url: string
    title: string
    timestamp: number
  }
  
  export class BrowserHistory {
    private history: HistoryEntry[] = []
    private currentIndex = -1
  
    push(url: string, title: string) {
      // Remove all entries after current index when new navigation occurs
      this.history = this.history.slice(0, this.currentIndex + 1)
  
      this.history.push({
        url,
        title,
        timestamp: Date.now(),
      })
      this.currentIndex++
    }
  
    back(): HistoryEntry | null {
      if (this.currentIndex > 0) {
        this.currentIndex--
        return this.history[this.currentIndex]
      }
      return null
    }
  
    forward(): HistoryEntry | null {
      if (this.currentIndex < this.history.length - 1) {
        this.currentIndex++
        return this.history[this.currentIndex]
      }
      return null
    }
  
    canGoBack(): boolean {
      return this.currentIndex > 0
    }
  
    canGoForward(): boolean {
      return this.currentIndex < this.history.length - 1
    }
  
    getCurrentEntry(): HistoryEntry | null {
      if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
        return this.history[this.currentIndex]
      }
      return null
    }
  }
  
  