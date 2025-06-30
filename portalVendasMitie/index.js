// Exibe ou oculta o campo de entrada
document.getElementById("qtdVezes").addEventListener("change", function () {
  const campoEntrada = document.getElementById("campoEntrada");
  campoEntrada.classList.toggle("hidden", this.value !== "2x");
});

// Função segura para formatar como moeda BRL
function formatarMoedaBrl(input) {
  // Remove qualquer caractere que não seja número
  let valor = input.value.replace(/\D/g, "");

  if (valor.length === 0) {
    valor = "0";
  }

  // Formata o número como moeda brasileira
  let valorFormatado = (parseInt(valor, 10) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Atualiza o valor formatado no input
  input.value = valorFormatado;
}

// Lista de campos com formatação monetária
const camposMonetarios = [
  document.getElementById("valorTotal"),
  document.getElementById("valorEntrada"),
];

// Aplica a formatação ao digitar
camposMonetarios.forEach((campo) => {
  campo.addEventListener("input", function (e) {
    const cursorPos = this.selectionStart;
    const valorAntigo = this.value;
    formatarMoedaBrl(this);

    // Ajuste fino para manter o cursor na posição correta (simples)
    const diff = this.value.length - valorAntigo.length;
    this.setSelectionRange(cursorPos + diff, cursorPos + diff);
  });

  // Valor inicial (opcional)
  campo.value = "R$ 0,00";
});

document.getElementById("formulario").addEventListener("submit", function (event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const data = {};
  let valorTotal = 0;
  let valorEntrada = 0;
  let qtdVezes = "";

  // Processa e limpa os dados
  formData.forEach((value, key) => {
    if (key === "Valor Total") {
      valorTotal = parseFloat(value.replace(/[R$\s.]/g, "").replace(",", ".")) || 0;
      data[key] = valorTotal.toFixed(2);
    } else if (key === "Valor de Entrada") {
      valorEntrada = parseFloat(value.replace(/[R$\s.]/g, "").replace(",", ".")) || 0;
      data[key] = valorEntrada.toFixed(2);
    } else if (key === "Quantidade de Vezes") {
      qtdVezes = value;
      data[key] = value;
    } else {
      data[key] = value;
    }
  });

  const url = "https://api.sheetmonkey.io/form/hLxooDBhCHFYaBi5N2BcLi";

  // Primeira linha (normal)
  const primeiraLinha = { ...data, Parcela: "1 de 2" };

  // Se for 2x, prepara também a segunda linha
  const enviarLinhas = qtdVezes === "2x"
    ? [
        primeiraLinha,
        {
          ...data,
          "Valor Total": (valorTotal - valorEntrada).toFixed(2),
          "Valor de Entrada": "",
          Parcela: "2 de 2",
        },
      ]
    : [{ ...data }];

  // Envia todas as linhas (uma ou duas)
  Promise.all(
    enviarLinhas.map((linha) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linha),
      })
    )
  )
    .then((responses) => {
      if (responses.every((res) => res.ok)) {
        alert("Formulário enviado com sucesso!");
        location.reload();
      } else {
        alert("Erro ao enviar. Tente novamente.");
      }
    })
    .catch(() => {
      alert("Erro ao enviar. Verifique sua conexão.");
    });
});
