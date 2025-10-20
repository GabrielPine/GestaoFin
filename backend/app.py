# app.py
from decimal import Decimal, InvalidOperation
from datetime import datetime, timedelta
import time
import traceback
import sqlalchemy.exc

from flask import request, jsonify
from flask_restful import Api, Resource
from flask_cors import CORS
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from resources.config import app, db, bcrypt   # usa seu config.py antigo (funcionando)
from resources.models import Usuario, Movimentacao, ContaPagar, ContaReceber


# -----------------------------------------------------------------------------
# Inicializações (não sobrescrever configs)
# -----------------------------------------------------------------------------
api = Api(app)
CORS(app)
mail = Mail(app)
s = URLSafeTimedSerializer(app.config['SECRET_KEY'])


# -----------------------------------------------------------------------------
# Helpers robustos
# -----------------------------------------------------------------------------
def parse_date_flex(s: str):
    """
    Aceita 'YYYY-MM-DD' ou 'DD/MM/YYYY' -> datetime.date
    """
    if not isinstance(s, str):
        raise ValueError("Data deve ser string")
    s = s.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    raise ValueError("Formato de data inválido (use YYYY-MM-DD ou DD/MM/YYYY)")


def to_decimal_brl(x):
    """
    Converte '1.234,56' / '1234,56' / '1234.56' / 1234.56 -> Decimal
    Retorna None se não conseguir converter.
    """
    if x is None:
        return None
    try:
        if isinstance(x, (int, float, Decimal)):
            return Decimal(str(x))
        s = str(x).strip()
        if s == "":
            return None
        # Formato BRL -> remove milhar '.' e troca ',' por '.'
        if ',' in s and (s.count(',') == 1):
            s = s.replace('.', '').replace(',', '.')
        return Decimal(s)
    except (InvalidOperation, ValueError, TypeError):
        return None


# -----------------------------------------------------------------------------
# Banco (retry para ambientes com MySQL subindo lento)
# -----------------------------------------------------------------------------
for i in range(10):
    try:
        with app.app_context():
            db.create_all()
        print("✅ Banco conectado com sucesso!")
        break
    except sqlalchemy.exc.OperationalError as e:
        print(f"❌ Tentativa {i+1}/10 falhou: {e}")
        time.sleep(3)
else:
    print("❌ Não foi possível conectar ao banco de dados após várias tentativas.")
    raise SystemExit(1)


# -----------------------------------------------------------------------------
# Resources / Rotas RESTful básicas
# -----------------------------------------------------------------------------
class Home(Resource):
    def get(self):
        return jsonify({"message": "Servidor Flask está rodando!"})


class Registro(Resource):
    def post(self):
        data = request.get_json() or {}
        if not all(k in data for k in ("username", "email", "senha")):
            return {"mensagem": "username, email e senha são obrigatórios"}, 400

        if Usuario.query.filter_by(email=data["email"]).first():
            return {"mensagem": "Usuário já existe"}, 400

        novo_usuario = Usuario(
            username=data["username"],
            email=data["email"],
        )
        # usa o setter do model (valida força e hashea com bcrypt)
        novo_usuario.senha = data["senha"]

        db.session.add(novo_usuario)
        db.session.commit()
        return {"mensagem": "Usuário registrado com sucesso", "id": novo_usuario.id}, 201


class Login(Resource):
    def post(self):
        data = request.get_json() or {}
        email = data.get("email")
        senha = data.get("senha", "")

        usuario = Usuario.query.filter_by(email=email).first()
        if usuario and usuario.verificar_senha(senha):
            return {
                "mensagem": "Login bem-sucedido",
                "usuario": {"id": usuario.id, "username": usuario.username}
            }
        return {"mensagem": "Credenciais inválidas"}, 401


class MovimentacoesFinanceiras(Resource):
    def get(self, usuario_id):
        movimentacoes = Movimentacao.query.filter_by(usuario_id=usuario_id).all()
        return jsonify([
            {
                "id": m.id,
                "tipo": m.tipo,
                "valor": float(m.valor),
                "data": m.data_movimentacao.strftime("%Y-%m-%d %H:%M:%S"),
            } for m in movimentacoes
        ])


class ListarUsuarios(Resource):
    def get(self):
        usuarios = Usuario.query.all()
        return jsonify([
            {"id": u.id, "username": u.username, "email": u.email} for u in usuarios
        ])


# -----------------------------------------------------------------------------
# Perfil (GET/PUT)
# -----------------------------------------------------------------------------
@app.route('/perfil/<int:user_id>', methods=['GET'])
def perfil_usuario(user_id):
    usuario = Usuario.query.get(user_id)
    if not usuario:
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    return jsonify({
        'id': usuario.id,
        'username': usuario.username,
        'email': usuario.email,
        'nomeCompleto': usuario.nomeCompleto,
        'dataNascimento': usuario.dataNascimento,
        'genero': usuario.genero,
        'cpf': usuario.cpf,
        'telefone': usuario.telefone,
        'endereco': usuario.endereco,
        'cidade': usuario.cidade,
        'estado': usuario.estado,
        'cep': usuario.cep,
        'rendaMensal': float(usuario.rendaMensal) if usuario.rendaMensal is not None else None,
        'objetivo': usuario.objetivo
    })


@app.route('/perfil/<int:user_id>', methods=['PUT'])
def atualizar_perfil(user_id):
    data = request.get_json() or {}
    usuario = Usuario.query.get(user_id)
    if not usuario:
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    usuario.username = data.get('username', usuario.username)
    usuario.email = data.get('email', usuario.email)
    usuario.nomeCompleto = data.get('nomeCompleto', usuario.nomeCompleto)
    usuario.dataNascimento = data.get('dataNascimento', usuario.dataNascimento)
    usuario.genero = data.get('genero', usuario.genero)
    usuario.cpf = data.get('cpf', usuario.cpf)
    usuario.telefone = data.get('telefone', usuario.telefone)
    usuario.endereco = data.get('endereco', usuario.endereco)
    usuario.cidade = data.get('cidade', usuario.cidade)
    usuario.estado = data.get('estado', usuario.estado)
    usuario.cep = data.get('cep', usuario.cep)

    renda = data.get('rendaMensal', usuario.rendaMensal)
    renda_dec = to_decimal_brl(renda) if renda is not None else None
    if renda is not None and renda_dec is None:
        return jsonify({'erro': 'rendaMensal inválida'}), 400
    usuario.rendaMensal = renda_dec

    usuario.objetivo = data.get('objetivo', usuario.objetivo)

    db.session.commit()
    return jsonify({'mensagem': 'Perfil atualizado com sucesso'})


# -----------------------------------------------------------------------------
# Reset de senha
# -----------------------------------------------------------------------------
class RequestPasswordReset(Resource):
    def post(self):
        try:
            data = request.get_json() or {}
            email = data.get('email')
            if not email:
                return jsonify({'mensagem': 'E-mail é obrigatório'}), 400

            usuario = Usuario.query.filter_by(email=email).first()
            if not usuario:
                return jsonify({'mensagem': 'Usuário não encontrado'}), 404

            token = s.dumps(email, salt='reset-password')
            reset_url = f"http://localhost:4200/reset-password/{token}"

            msg = Message(
                subject='Redefinição de Senha',
                recipients=[email],
                body=f'Clique no link para redefinir sua senha: {reset_url}'
            )
            mail.send(msg)
            return jsonify({'mensagem': 'E-mail de redefinição enviado com sucesso!', 'status': 'success'})

        except Exception:
            print("🔥 Erro em /request-password-reset:\n", traceback.format_exc())
            return jsonify({'mensagem': 'Erro no servidor ao enviar e-mail', 'status': 'error'}), 500


class ResetPassword(Resource):
    def post(self, token):
        try:
            email = s.loads(token, salt='reset-password', max_age=3600)
        except SignatureExpired:
            return jsonify({'mensagem': 'Token expirado'}), 400
        except (BadSignature, Exception):
            return jsonify({'mensagem': 'Token inválido'}), 400

        data = request.get_json() or {}
        nova_senha = data.get('password')
        if not nova_senha:
            return jsonify({'mensagem': 'Senha é obrigatória'}), 400

        usuario = Usuario.query.filter_by(email=email).first()
        if not usuario:
            return jsonify({'mensagem': 'Usuário não encontrado'}), 404

        usuario.senha = nova_senha  # setter: valida e faz hash (bcrypt)
        db.session.commit()
        return jsonify({'mensagem': 'Senha redefinida com sucesso!'}), 200


# -----------------------------------------------------------------------------
# Contas a Pagar (Débitos)
# -----------------------------------------------------------------------------
@app.route('/conta', methods=['POST'])
@app.route('/contas', methods=['POST'])
def adicionar_conta():
    """
    Aceita JSON ou form-data.
    Valida usuario_id existente, valor e data.
    Trata IntegrityError/erros gerais com rollback e mensagens claras.
    """
    from sqlalchemy.exc import IntegrityError

    data = request.get_json(force=True, silent=True) or request.form.to_dict() or {}
    print("📥 [POST /conta] payload:", data, "| headers:", dict(request.headers))

    # usuario_id
    try:
        usuario_id = int(data.get('usuario_id'))
    except (TypeError, ValueError):
        return jsonify({'mensagem': 'usuario_id inválido'}), 400

    if not Usuario.query.get(usuario_id):
        return jsonify({'mensagem': f'Usuário {usuario_id} não encontrado'}), 400

    # descricao
    descricao = (data.get('descricao') or '').strip()
    if not descricao:
        return jsonify({'mensagem': 'descricao é obrigatória'}), 400

    # valor
    valor_raw = data.get('valor')
    valor = to_decimal_brl(valor_raw)
    if valor is None:
        return jsonify({'mensagem': f'Valor inválido (recebido={valor_raw!r}). Use 1234,56 ou 1234.56'}), 400

    # data
    data_raw = data.get('data')
    try:
        data_mov = parse_date_flex(str(data_raw))
    except Exception:
        return jsonify({'mensagem': f'Data inválida (recebido={data_raw!r}). Use YYYY-MM-DD ou DD/MM/YYYY'}), 400

    # persiste
    conta = ContaPagar(
        usuario_id=usuario_id,
        descricao=descricao,
        valor=valor,
        data=data_mov
    )
    db.session.add(conta)
    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        print("🔥 IntegrityError no /conta:", repr(e))
        return jsonify({'mensagem': 'Falha de integridade (FK/UNIQUE). Verifique o usuário e os dados.'}), 400
    except Exception:
        db.session.rollback()
        print("🔥 Erro inesperado no /conta:\n", traceback.format_exc())
        return jsonify({'mensagem': 'Erro interno ao salvar o débito.'}), 500

    print("✅ [POST /conta] salvo id:", conta.id)
    return jsonify({
        'mensagem': 'Conta adicionada com sucesso!',
        'conta': {
            'id': conta.id,
            'usuario_id': usuario_id,
            'descricao': descricao,
            'valor': float(valor),
            'data': data_mov.strftime('%Y-%m-%d')
        }
    }), 201


@app.route('/conta/<int:conta_id>', methods=['DELETE'])
def deletar_conta(conta_id):
    conta = ContaPagar.query.get(conta_id)
    if not conta:
        return jsonify({'mensagem': 'Conta não encontrada'}), 404
    db.session.delete(conta)
    db.session.commit()
    return jsonify({'mensagem': 'Conta excluída com sucesso'}), 200


@app.route('/contas/<int:usuario_id>', methods=['GET'])
def listar_contas(usuario_id):
    contas = ContaPagar.query.filter_by(usuario_id=usuario_id).all()
    return jsonify([
        {"id": c.id, "descricao": c.descricao, "valor": float(c.valor), "data": c.data.strftime('%Y-%m-%d')}
        for c in contas
    ])


# -----------------------------------------------------------------------------
# Contas a Receber (Entradas)
# -----------------------------------------------------------------------------
@app.route('/receber', methods=['POST'])
def adicionar_conta_receber():
    from sqlalchemy.exc import IntegrityError

    data = request.get_json(force=True, silent=True) or request.form.to_dict() or {}
    print("📥 [POST /receber] payload:", data, "| headers:", dict(request.headers))

    try:
        usuario_id = int(data.get('usuario_id'))
    except (TypeError, ValueError):
        return jsonify({'mensagem': 'usuario_id inválido'}), 400

    if not Usuario.query.get(usuario_id):
        return jsonify({'mensagem': f'Usuário {usuario_id} não encontrado'}), 400

    descricao = (data.get('descricao') or '').strip()
    if not descricao:
        return jsonify({'mensagem': 'descricao é obrigatória'}), 400

    valor_raw = data.get('valor')
    valor = to_decimal_brl(valor_raw)
    if valor is None:
        return jsonify({'mensagem': f'Valor inválido (recebido={valor_raw!r}). Use 1234,56 ou 1234.56'}), 400

    data_raw = data.get('data')
    try:
        data_mov = parse_date_flex(str(data_raw))
    except Exception:
        return jsonify({'mensagem': f'Data inválida (recebido={data_raw!r}). Use YYYY-MM-DD ou DD/MM/YYYY'}), 400

    conta = ContaReceber(
        usuario_id=usuario_id,
        descricao=descricao,
        valor=valor,
        data=data_mov
    )
    db.session.add(conta)
    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        print("🔥 IntegrityError no /receber:", repr(e))
        return jsonify({'mensagem': 'Falha de integridade (FK/UNIQUE). Verifique o usuário e os dados.'}), 400
    except Exception:
        db.session.rollback()
        print("🔥 Erro inesperado no /receber:\n", traceback.format_exc())
        return jsonify({'mensagem': 'Erro interno ao salvar a receita.'}), 500

    print("✅ [POST /receber] salvo id:", conta.id)
    return jsonify({
        'mensagem': 'Entrada registrada com sucesso!',
        'receber': {
            'id': conta.id,
            'usuario_id': usuario_id,
            'descricao': descricao,
            'valor': float(valor),
            'data': data_mov.strftime('%Y-%m-%d')
        }
    }), 201


@app.route('/receber/<int:conta_id>', methods=['DELETE'])
def deletar_conta_receber(conta_id):
    conta = ContaReceber.query.get(conta_id)
    if not conta:
        return jsonify({'mensagem': 'Receita não encontrada'}), 404
    db.session.delete(conta)
    db.session.commit()
    return jsonify({'mensagem': 'Receita excluída com sucesso'}), 200


@app.route('/receber/<int:usuario_id>', methods=['GET'])
def listar_contas_receber(usuario_id):
    contas = ContaReceber.query.filter_by(usuario_id=usuario_id).all()
    return jsonify([
        {"id": c.id, "descricao": c.descricao, "valor": float(c.valor), "data": c.data.strftime('%Y-%m-%d')}
        for c in contas
    ])


# -----------------------------------------------------------------------------
# Extrato (débitos + créditos)
# -----------------------------------------------------------------------------
@app.route('/api/extrato', methods=['GET'])
@app.route('/api/extrato/<int:usuario_id>', methods=['GET'])
def api_extrato(usuario_id=None):
    # usuario_id pode vir da rota ou querystring
    if usuario_id is None:
        usuario_id = request.args.get('usuario_id', type=int)

    start_str = request.args.get('start')
    end_str = request.args.get('end')

    if not usuario_id:
        return jsonify({'error': 'usuario_id é obrigatório (na rota ou query param)'}), 400
    if not start_str or not end_str:
        return jsonify({'error': 'start e end são obrigatórios (YYYY-MM-DD ou DD/MM/YYYY)'}), 400

    try:
        start = parse_date_flex(start_str)
        end = parse_date_flex(end_str)
    except ValueError:
        return jsonify({'error': 'Formato de data inválido. Use YYYY-MM-DD ou DD/MM/YYYY.'}), 400

    # incluir o último dia todo [start, end+1)
    end_inclusive = end + timedelta(days=1)

    debitos = ContaPagar.query.filter(
        ContaPagar.usuario_id == usuario_id,
        ContaPagar.data >= start,
        ContaPagar.data < end_inclusive
    ).all()

    creditos = ContaReceber.query.filter(
        ContaReceber.usuario_id == usuario_id,
        ContaReceber.data >= start,
        ContaReceber.data < end_inclusive
    ).all()

    out = []
    for d in debitos:
        out.append({
            'id': d.id,
            'tipo': 'DEBITO',
            'descricao': d.descricao,
            'data': d.data.strftime('%Y-%m-%d'),
            'valor': float(d.valor)
        })
    for c in creditos:
        out.append({
            'id': c.id,
            'tipo': 'CREDITO',
            'descricao': c.descricao,
            'data': c.data.strftime('%Y-%m-%d'),
            'valor': float(c.valor)
        })

    out.sort(key=lambda x: (x['data'], x['id']))
    return jsonify(out)


# -----------------------------------------------------------------------------
# Bind das rotas RESTful
# -----------------------------------------------------------------------------
api.add_resource(Home, '/')
api.add_resource(Registro, '/registrar')
api.add_resource(Login, '/login')
api.add_resource(MovimentacoesFinanceiras, '/movimentacoes/<int:usuario_id>')
api.add_resource(ListarUsuarios, '/listar')
api.add_resource(RequestPasswordReset, '/request-password-reset')
api.add_resource(ResetPassword, '/reset-password/<token>')


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # segurança extra para rodar fora de container
    app.run(debug=True, host='0.0.0.0', port=5000)
