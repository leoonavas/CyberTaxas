window.addEventListener('DOMContentLoaded', () => {
  const video = document.querySelector('.video-bg');
  
  if (video) {
    video.muted = true; 
    
    
    video.play().catch(error => {
      console.log("O autoplay foi bloqueado pelo navegador. Tentando recarregar o player...", error);
      
      
      document.body.addEventListener('click', () => {
        video.play();
      }, { once: true });
    });
  }
});